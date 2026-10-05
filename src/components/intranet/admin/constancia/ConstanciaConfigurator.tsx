"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { fetchInstitutionConfig, updateInstitutionConfig } from "@/redux/service/institutionConfigService";
import { defaultInstitutionConfig } from "@/utils/constanciaConfig";
import { getConstanciaPreviewDataUrl } from "@/utils/generateConstanciaPdf";
import { InstitutionConfig } from "@/types/institutionConfig";
import { SectionReport } from "@/types/report";
import { IconPlus, IconTrash, IconDeviceFloppy } from "@tabler/icons-react";
import { useToast } from "@/components/intranet/ui/Toast";

// Sample section report used only to render the live PDF preview — one
// active student with two graded activities is enough for the admin to see
// exactly how header/body/table/signature look, without touching any real
// section data.
const SAMPLE_REPORT: SectionReport = {
  section: { id: 0, name: "Muestra", courseName: "Cosmetología Integral" },
  activities: [
    { id: 1, name: "Examen parcial", percentage: 40 },
    { id: 2, name: "Proyecto final", percentage: 60 },
  ],
  students: [
    {
      enrollmentId: 0,
      dni: "V-12.345.678",
      fullName: "María Fernanda Pérez",
      active: true,
      grades: [
        { activityId: 1, grade: 18 },
        { activityId: 2, grade: 17 },
      ],
      average: 17.4,
    },
  ],
};

const PREVIEW_DEBOUNCE_MS = 400;

interface ConstanciaFormValues {
  academyName: string;
  headerLines: { value: string }[];
  signatoryName: string;
  signatoryTitle: string;
  city: string;
  contactFooter: string;
  gradeScaleText: string;
  minApproving: number;
  approvedLabel: string;
  failedLabel: string;
}

function toFormValues(source: InstitutionConfig): ConstanciaFormValues {
  return {
    academyName: source.academyName,
    headerLines: source.headerLines.map((value) => ({ value })),
    signatoryName: source.signatoryName,
    signatoryTitle: source.signatoryTitle,
    city: source.city,
    contactFooter: source.contactFooter,
    gradeScaleText: source.gradeScaleText,
    minApproving: source.minApproving,
    approvedLabel: source.approvedLabel,
    failedLabel: source.failedLabel,
  };
}

function toConfigPayload(values: ConstanciaFormValues): Partial<Omit<InstitutionConfig, "id">> {
  return {
    academyName: values.academyName,
    headerLines: values.headerLines.map((line) => line.value).filter((line) => line.trim().length > 0),
    signatoryName: values.signatoryName,
    signatoryTitle: values.signatoryTitle,
    city: values.city,
    contactFooter: values.contactFooter,
    gradeScaleText: values.gradeScaleText,
    minApproving: Number.isFinite(Number(values.minApproving)) ? Number(values.minApproving) : 0,
    approvedLabel: values.approvedLabel,
    failedLabel: values.failedLabel,
  };
}

// Admin-only configurator for the Constancia de Calificaciones PDF
// (PLAN_FEATURES 4.4 polish). Seeds the form from the backend-driven
// `InstitutionConfig` (falling back to `defaultInstitutionConfig` if the
// fetch fails or hasn't resolved yet), and renders a debounced live PDF
// preview in an iframe using the exact same doc-definition builder the real
// download uses (`getConstanciaPreviewDataUrl`), so what the admin sees here
// is guaranteed to match the real output.
function ConstanciaConfigurator() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const config = useAppSelector((state) => state.institutionConfig.config);
  const loading = useAppSelector((state) => state.institutionConfig.loading);
  const saving = useAppSelector((state) => state.institutionConfig.saving);
  const errorMessage = useAppSelector((state) => state.institutionConfig.errorMessage);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewRequestId = useRef(0);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConstanciaFormValues>({
    defaultValues: toFormValues(defaultInstitutionConfig),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "headerLines" });
  const watchedValues = useWatch({ control }) as ConstanciaFormValues;

  // Fetch and seed in one flow: seed directly from the thunk's own resolved
  // result instead of racing a separate effect against `loading`/`config`
  // state. Racing was the previous (buggy) approach — on first mount
  // `loading` was still `false` and `config` was still `null` (initial slice
  // state), so a separate seed effect fired immediately with defaults and
  // never re-seeded once the real fetch resolved, silently discarding the
  // backend's saved config from the form.
  useEffect(() => {
    let cancelled = false;
    dispatch(fetchInstitutionConfig())
      .unwrap()
      .then((result) => {
        if (!cancelled) reset(toFormValues(result.data));
      })
      .catch(() => {
        if (!cancelled) reset(toFormValues(defaultInstitutionConfig));
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, reset]);

  // Debounced live preview: rebuilds the PDF ~400ms after the admin stops
  // typing. `getConstanciaPreviewDataUrl` resolves a `data:` URL directly
  // (pdfmake's own `getDataUrl()`), not a blob object URL, so there is no
  // `URL.revokeObjectURL` cleanup to do — the request-id guard below just
  // discards stale/out-of-order responses so a slow earlier render can never
  // overwrite a newer one.
  useEffect(() => {
    if (!watchedValues) return;
    const requestId = ++previewRequestId.current;
    const timer = setTimeout(() => {
      const previewConfig: InstitutionConfig = {
        id: config?.id ?? defaultInstitutionConfig.id,
        ...toConfigPayload(watchedValues),
      } as InstitutionConfig;

      getConstanciaPreviewDataUrl(SAMPLE_REPORT, previewConfig)
        .then((dataUrl) => {
          if (previewRequestId.current !== requestId) return;
          setPreviewUrl(dataUrl);
          setPreviewError(null);
        })
        .catch((error) => {
          if (previewRequestId.current !== requestId) return;
          setPreviewError(error instanceof Error ? error.message : "No se pudo generar la vista previa");
        });
    }, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues]);

  // Load/save failures live in Redux (`errorMessage` is reset to null when a
  // new request starts), so surface each one as a toast.
  // An error already in the store at mount is stale (Redux persists it across
  // navigation), so skip it until the value is cleared by a new request.
  const staleError = useRef(errorMessage);
  useEffect(() => {
    if (!errorMessage) {
      staleError.current = null;
      return;
    }
    if (errorMessage === staleError.current) return;
    toast.error(errorMessage);
  }, [errorMessage, toast]);

  const onSubmit = handleSubmit(async (values) => {
    const resultAction = await dispatch(updateInstitutionConfig(toConfigPayload(values)));
    if (updateInstitutionConfig.fulfilled.match(resultAction)) {
      toast.success(resultAction.payload.message || "Configuración guardada correctamente");
    }
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-black">Configurar Constancia de Calificaciones</h2>
      </div>

      {loading && !config ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-lg text-darkpink" />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full lg:w-1/2">
            <div className="flex flex-col gap-1">
              <label htmlFor="constancia-academy-name" className="text-sm font-medium text-gray-500">Nombre de la academia</label>
              <input
                id="constancia-academy-name"
                className="input-search"
                aria-invalid={errors.academyName ? true : undefined}
                aria-describedby={errors.academyName ? "constancia-academy-name-error" : undefined}
                {...register("academyName", { required: true })}
              />
              {errors.academyName && (
                <span id="constancia-academy-name-error" className="text-error text-xs">
                  Este campo es requerido
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-500">Líneas del encabezado</label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <input className="input-search flex-1" {...register(`headerLines.${index}.value` as const)} />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label="Eliminar línea"
                    title={fields.length === 1 ? "Debe quedar al menos una línea de encabezado" : undefined}
                    className="btn btn-sm btn-square size-10 min-h-10 bg-white text-black border border-grey hover:bg-darkpink hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black">
                    <IconTrash size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => append({ value: "" })}
                className="btn btn-sm min-h-10 self-start bg-darkpink text-white border-none hover:bg-black">
                <IconPlus size={16} />
                Agregar línea
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-500">Nombre del/de la firmante</label>
                <input className="input-search" {...register("signatoryName")} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-500">Cargo del/de la firmante</label>
                <input className="input-search" {...register("signatoryTitle")} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-500">Ciudad</label>
                <input className="input-search" {...register("city")} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-500">Pie de página de contacto</label>
                <input className="input-search" {...register("contactFooter")} />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-500">Texto de la escala de calificación</label>
              <textarea
                className="textarea textarea-bordered bg-white text-black w-full"
                rows={2}
                {...register("gradeScaleText")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="constancia-min-approving" className="text-sm font-medium text-gray-500">Calificación mínima aprobatoria</label>
                <input
                  id="constancia-min-approving"
                  aria-invalid={errors.minApproving ? true : undefined}
                  aria-describedby={errors.minApproving ? "constancia-min-approving-error" : undefined}
                  type="number"
                  min={0}
                  max={20}
                  className="input-search"
                  {...register("minApproving", { valueAsNumber: true, min: 0, max: 20, required: true })}
                />
                {errors.minApproving && (
                  <span id="constancia-min-approving-error" className="text-error text-xs">
                    Debe estar entre 0 y 20
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-500">Etiqueta &quot;Aprobado&quot;</label>
                <input className="input-search" {...register("approvedLabel")} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-500">Etiqueta &quot;Desaprobado&quot;</label>
                <input className="input-search" {...register("failedLabel")} />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-sm w-full sm:w-auto self-start bg-darkpink text-white border-none hover:bg-black disabled:opacity-60">
              {saving ? <span className="loading loading-spinner loading-xs" /> : <IconDeviceFloppy size={16} />}
              Guardar
            </button>
          </form>

          <div className="flex flex-col gap-2 w-full lg:w-1/2">
            <span className="text-sm font-medium text-gray-500">Vista previa</span>
            {previewError && <div role="alert" className="alert alert-error text-white text-sm">{previewError}</div>}
            <div className="relative w-full h-[70vh] lg:h-[calc(100vh-220px)] border border-grey rounded-lg overflow-hidden bg-white">
              {previewUrl ? (
                <iframe src={previewUrl} title="Vista previa de la constancia" className="w-full h-full" />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <span className="loading loading-spinner loading-lg text-darkpink" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConstanciaConfigurator;
