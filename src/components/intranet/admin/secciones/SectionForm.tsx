"use client";

import { IconAlertTriangle, IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { LoadingButton } from "@/components/intranet/ui/LoadingButton";
import { useUnsavedChanges, useUnsavedGuard } from "@/components/intranet/ui/UnsavedChanges";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { CreateSection, Section, UpdateSection } from "@/types/section";
import { createSection, updateSection } from "@/redux/service/sectionService";
import { fetchCourses } from "@/redux/service/courseService";
import { fetchUsers } from "@/redux/service/userService";
import { fetchGrade } from "@/redux/service/gradeService";
import { Roles } from "@/types/roles";
import { normalizeLeadingZero } from "@/utils/numberInput";

interface SectionFormProps {
  selectedSection: Section | null;
  onCancel: () => void;
  onSuccess: (message: string) => void;
}

interface ActivityFieldValue {
  id?: number;
  name: string;
  // Empty string while the admin has not typed anything (no misleading 0).
  percentage: number | "";
}

interface SectionFormValues {
  id_course: string;
  name: string;
  id_tutor: string;
  initialDate: string;
  endDate: string;
  installmentsCount?: number;
  activities: ActivityFieldValue[];
}

// The backend/date input round-trip: values coming from Redux are JSON
// strings at runtime (typed as `Date` only at compile time). `<input
// type="date">` needs exactly "YYYY-MM-DD".
function toDateInputValue(value: unknown): string {
  if (!value) return "";
  return String(value).slice(0, 10);
}

const OPTIONAL_INT_ERROR = "Debe ser un número entero mayor o igual a 1";

// Mirrors CreateActivityDto: percentage > 0, <= 100, max 2 decimals.
function validatePercentage(value: unknown): true | string {
  const raw = String(value ?? "").trim();
  if (raw === "") return "Este campo es requerido";
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return "Ingresa un número válido con máximo 2 decimales";
  const n = Number(raw);
  if (n <= 0) return "Debe ser mayor que 0";
  if (n > 100) return "No puede ser mayor que 100";
  return true;
}

// Splits 100% across `count` activities in 2-decimal steps; the remainder goes
// to the last one (3 -> 33.33, 33.33, 33.34).
function splitEvenly(count: number): number[] {
  const base = Math.floor((100 / count) * 100) / 100;
  const last = Math.round((100 - base * (count - 1)) * 100) / 100;
  return Array.from({ length: count }, (_, i) => (i === count - 1 ? last : base));
}

function calculateDurationInMonths(start: Date, end: Date) {
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  return months <= 0 ? 1 : months;
}

function SectionForm({ selectedSection, onCancel, onSuccess }: SectionFormProps) {
  const dispatch = useAppDispatch();
  const courses = useAppSelector((state) => state.course?.courses) || [];
  const users = useAppSelector((state) => state.user?.users) || [];
  const tutors = users.filter((user) => user.role === Roles.TUTOR);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Set right before onSuccess so the unsaved guard does not fire on the redirect.
  const [justSaved, setJustSaved] = useState(false);
  const { confirmLeave } = useUnsavedGuard();
  // Activity Editing With Existing Grades (spec: "section-management"
  // domain) — maps persisted activity id -> recorded grade count, so an
  // explicit warning can be shown before the admin edits/removes it.
  const [gradeCounts, setGradeCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    const persistedActivityIds = (selectedSection?.activities || [])
      .filter((activity) => activity.id != null)
      .map((activity) => activity.id as number);

    if (persistedActivityIds.length === 0) {
      setGradeCounts({});
      return;
    }

    let cancelled = false;
    (async () => {
      const counts: Record<number, number> = {};
      for (const activityId of persistedActivityIds) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const result = await dispatch(fetchGrade(activityId)).unwrap();
          counts[activityId] = Array.isArray(result?.data) ? result.data.length : 0;
        } catch {
          counts[activityId] = 0;
        }
      }
      if (!cancelled) setGradeCounts(counts);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection?.id]);

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    trigger,
    formState: { errors, isDirty },
  } = useForm<SectionFormValues>({
    defaultValues: selectedSection
      ? {
          id_course: selectedSection.course?.id ? String(selectedSection.course.id) : "",
          name: selectedSection.name,
          id_tutor: selectedSection.tutor?.id ? String(selectedSection.tutor.id) : "",
          initialDate: toDateInputValue(selectedSection.initialDate),
          endDate: toDateInputValue(selectedSection.endDate),
          installmentsCount: selectedSection.installmentsCount,
          activities: (selectedSection.activities || []).map((activity) => ({
            id: activity.id,
            name: activity.name,
            percentage: activity.percentage,
          })),
        }
      : { activities: [] },
  });

  // Registered once (not inline in JSX) so the wrapped onChange below can
  // forward to the exact same RHF-bound handler without re-registering the
  // field (which would silently drop the `min` validation rule).
  const installmentsCountField = register("installmentsCount", {
    // Optional (DTO: IsOptional + IsNumber); when present it must be an integer >= 1.
    validate: (value) => {
      const raw = String(value ?? "").trim();
      if (raw === "") return true;
      const n = Number(raw);
      return (Number.isInteger(n) && n >= 1) || OPTIONAL_INT_ERROR;
    },
  });
  const addActivityButtonRef = useRef<HTMLButtonElement | null>(null);

  const { fields, append, remove } = useFieldArray({ control, name: "activities" });
  const watchedActivities = useWatch({ control, name: "activities" }) || [];
  const percentageSum =
    Math.round(
      watchedActivities.reduce((total, activity) => total + (Number(activity?.percentage) || 0), 0) * 100,
    ) / 100;
  // Suma: informational only — never blocks submit (business rule).
  const sumDiff = Math.round((100 - percentageSum) * 100) / 100;
  const sumClass =
    percentageSum === 100
      ? "bg-green-100 text-green-800 border-green-300"
      : percentageSum > 100
        ? "bg-red-100 text-red-800 border-red-300"
        : "bg-amber-100 text-amber-900 border-amber-300";
  const sumText =
    percentageSum === 100
      ? "Suma: 100%"
      : percentageSum > 100
        ? `Suma: ${percentageSum}% · Te pasaste ${Math.round((percentageSum - 100) * 100) / 100}%`
        : `Suma: ${percentageSum}% · Faltan ${sumDiff}%`;

  // No prompt while saving or right after a successful save (redirect).
  const dirty = isDirty && !saving && !justSaved;
  useUnsavedChanges("seccion-form", dirty, "Sección");

  const initialDateValue = useWatch({ control, name: "initialDate" });

  const distributeEvenly = () => {
    const count = getValues("activities").length;
    if (count === 0) return;
    splitEvenly(count).forEach((value, i) => {
      setValue(`activities.${i}.percentage`, value, { shouldDirty: true });
    });
    void trigger("activities");
  };

  const onSubmit = async (data: SectionFormValues) => {
    setValidationError(null);

    if (data.activities.length === 0) {
      setValidationError("Agrega al menos una actividad.");
      addActivityButtonRef.current?.focus();
      return;
    }

    const activitiesPayload = data.activities.map(({ id, name, percentage }) => ({
      ...(id != null ? { id } : {}),
      name,
      percentage: Number.parseFloat(Number(percentage).toFixed(2)),
    }));

    const duration = calculateDurationInMonths(new Date(data.initialDate), new Date(data.endDate));

    setSaving(true);
    try {
      if (selectedSection) {
        const updatePayload: UpdateSection = {
          name: data.name,
          initialDate: data.initialDate as unknown as Date,
          endDate: data.endDate as unknown as Date,
          duration,
          installmentsCount: data.installmentsCount ? Number(data.installmentsCount) : undefined,
          id_tutor: data.id_tutor || undefined,
          id_course: Number(data.id_course),
          activities: activitiesPayload,
        };
        const resultAction = await dispatch(
          updateSection({ sectionId: selectedSection.id, data: updatePayload }),
        );
        if (updateSection.fulfilled.match(resultAction)) {
          setJustSaved(true);
          onSuccess(resultAction.payload.message);
        } else if (updateSection.rejected.match(resultAction)) {
          setValidationError(resultAction.payload ?? "Error al guardar la sección");
        }
      } else {
        const createPayload: CreateSection = {
          name: data.name,
          initialDate: data.initialDate as unknown as Date,
          endDate: data.endDate as unknown as Date,
          duration,
          installmentsCount: data.installmentsCount ? Number(data.installmentsCount) : undefined,
          id_tutor: data.id_tutor || undefined,
          id_course: Number(data.id_course),
          activities: activitiesPayload,
        };
        const resultAction = await dispatch(createSection(createPayload));
        if (createSection.fulfilled.match(resultAction)) {
          setJustSaved(true);
          onSuccess(resultAction.payload.message);
        } else if (createSection.rejected.match(resultAction)) {
          setValidationError(resultAction.payload ?? "Error al guardar la sección");
        }
      }
    } catch (error) {
      console.error(error);
      setValidationError("Error al guardar la sección");
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = (hasError: boolean) =>
    `input input-bordered w-full h-11 bg-white text-black text-base ${hasError ? "input-error" : ""}`;
  const selectClass = (hasError: boolean) =>
    `select select-bordered w-full h-11 bg-white text-black text-base ${hasError ? "select-error" : ""}`;
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const helperClass = "text-xs text-gray-500 mt-1 pl-1 block";
  const requiredMark = (
    <>
      <span aria-hidden="true" className="text-error"> *</span>
      <span className="sr-only"> obligatorio</span>
    </>
  );
  const errorClass = "text-error text-xs mt-1 pl-1 block";

  return (
    <div className="overflow-x-clip bg-white rounded-lg shadow relative p-3 sm:p-6 md:p-10">
      <h2 className="text-2xl font-medium mb-6">
        {selectedSection ? "Editar Sección" : "Crear Sección"}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="w-full min-w-0">
            <label htmlFor="section-course" className={labelClass}>
              Curso{requiredMark}
            </label>
            <select
              id="section-course"
              defaultValue={selectedSection?.course?.id ? String(selectedSection.course.id) : ""}
              aria-invalid={errors.id_course ? true : undefined}
              aria-describedby={errors.id_course ? "section-course-error" : undefined}
              className={selectClass(!!errors.id_course)}
              {...register("id_course", { required: "Este campo es requerido" })}>
              <option disabled value="">
                Selecciona un curso
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
            {errors.id_course && (
              <span id="section-course-error" className={errorClass}>
                {errors.id_course.message}
              </span>
            )}
          </div>
          <div className="w-full min-w-0">
            <label htmlFor="section-tutor" className={labelClass}>
              Tutor
            </label>
            <select
              id="section-tutor"
              defaultValue={selectedSection?.tutor?.id ? String(selectedSection.tutor.id) : ""}
              className={selectClass(false)}
              {...register("id_tutor")}>
              <option value="">Sin tutor asignado</option>
              {tutors.map((tutor) => (
                <option key={tutor.id} value={tutor.id}>
                  {tutor.name} {tutor.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="section-name" className={labelClass}>
            Nombre de la sección{requiredMark}
          </label>
          <input
            id="section-name"
            type="text"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "section-name-error" : undefined}
            className={fieldClass(!!errors.name)}
            {...register("name", {
              required: "Este campo es requerido",
              validate: (value) =>
                (value ?? "").trim().length >= 3 || "Debe tener al menos 3 caracteres",
            })}
          />
          {errors.name && (
            <span id="section-name-error" className={errorClass}>
              {errors.name.message}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Label stacked above the input (not inline) so the row fits at
              360px; `min-w-0` overrides the native date input's intrinsic
              min-content width, which otherwise can force the row wider than
              the viewport. */}
          <div className="w-full min-w-0">
            <label htmlFor="section-initial-date" className={labelClass}>
              Inicio{requiredMark}
            </label>
            <input
              id="section-initial-date"
              type="date"
              aria-invalid={errors.initialDate ? true : undefined}
              aria-describedby={errors.initialDate ? "section-initial-date-error" : undefined}
              className={`${fieldClass(!!errors.initialDate)} min-w-0 [color-scheme:light]`}
              {...register("initialDate", {
                required: "Este campo es requerido",
                // Re-check the end date when the start changes, but only if it
                // already has a value (avoids a premature "required" error).
                onChange: () => {
                  if (getValues("endDate")) void trigger("endDate");
                },
              })}
            />
            {errors.initialDate && (
              <span id="section-initial-date-error" className={errorClass}>
                {errors.initialDate.message}
              </span>
            )}
          </div>
          <div className="w-full min-w-0">
            <label htmlFor="section-end-date" className={labelClass}>
              Fin{requiredMark}
            </label>
            <input
              id="section-end-date"
              type="date"
              min={initialDateValue || undefined}
              aria-invalid={errors.endDate ? true : undefined}
              aria-describedby={errors.endDate ? "section-end-date-error" : undefined}
              className={`${fieldClass(!!errors.endDate)} min-w-0 [color-scheme:light]`}
              {...register("endDate", {
                required: "Este campo es requerido",
                validate: (value) => {
                  const start = getValues("initialDate");
                  return !start || !value || value >= start || "La fecha de fin no puede ser anterior a la de inicio";
                },
              })}
            />
            {errors.endDate && (
              <span id="section-end-date-error" className={errorClass}>
                {errors.endDate.message}
              </span>
            )}
          </div>
        </div>

        <div className="w-full">
          <label htmlFor="section-installments" className={labelClass}>
            Cuotas
          </label>
          <input
            id="section-installments"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            aria-invalid={errors.installmentsCount ? true : undefined}
            aria-describedby={
              errors.installmentsCount ? "section-installments-error" : "section-installments-help"
            }
            className={`${fieldClass(!!errors.installmentsCount)} [color-scheme:light]`}
            placeholder="Opcional"
            {...installmentsCountField}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const raw = e.target.value;
              const normalized = normalizeLeadingZero(raw);
              if (normalized !== raw) e.target.value = normalized;
              installmentsCountField.onChange(e);
            }}
          />
          {errors.installmentsCount ? (
            <span id="section-installments-error" className={errorClass}>
              {errors.installmentsCount.message}
            </span>
          ) : (
            <span id="section-installments-help" className={helperClass}>
              Opcional. Número de cuotas que se generarán por alumno inscrito.
            </span>
          )}
        </div>

        <div className="mt-2">
          <div className="flex gap-3 flex-wrap justify-between items-center">
            <h4 className="font-semibold text-xl">Actividades</h4>
            <div className="flex gap-2 flex-wrap items-center">
              <button
                type="button"
                onClick={distributeEvenly}
                disabled={fields.length === 0}
                className="btn btn-sm min-h-10 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">
                Repartir equitativamente
              </button>
              <button
                type="button"
                ref={addActivityButtonRef}
                onClick={() => append({ name: "", percentage: "" }, { shouldFocus: true, focusName: `activities.${fields.length}.name` })}
                className="btn btn-sm min-h-10 bg-darkpink border-none text-white text-base">
                Agregar <IconPlus size={16} />
              </button>
            </div>
          </div>
          <div
            role="status"
            aria-live="polite"
            className={`mt-3 inline-block rounded-full border px-3 py-1 text-sm font-medium ${sumClass}`}>
            {sumText}
          </div>
          <div
            aria-hidden="true"
            className="hidden sm:grid grid-cols-[1fr_7rem_2.5rem] gap-3 mt-4 px-1 text-xs font-medium text-gray-500">
            <span>Actividad</span>
            <span>%</span>
            <span />
          </div>
          <ul className="flex gap-3 flex-col mt-2 sm:mt-1">
            {fields.map((field, index) => {
              // NOTE: `field.id` here is react-hook-form's own internal
              // field key (an auto-generated string), which SHADOWS our
              // data's `id` property — it is NOT the activity's numeric id.
              // The real persisted activity id must be read from the
              // watched form values instead.
              const activityId = watchedActivities[index]?.id;
              const gradeCount = activityId != null ? gradeCounts[activityId] : undefined;
              const nameError = errors.activities?.[index]?.name;
              const percentageError = errors.activities?.[index]?.percentage;
              const nameErrorId = `activity-${index}-name-error`;
              const percentageErrorId = `activity-${index}-percentage-error`;
              // Same "register once, wrap onChange" pattern as
              // installmentsCountField above — avoids re-registering (and
              // losing the validation rule) on every keystroke.
              const percentageField = register(`activities.${index}.percentage`, {
                validate: validatePercentage,
              });
              return (
                <li key={field.id} className="flex flex-col gap-1.5 rounded-lg border border-gray-200 p-2.5 sm:border-0 sm:p-0">
                  <div className="grid grid-cols-[1fr_2.5rem] sm:grid-cols-[1fr_7rem_2.5rem] gap-x-3 gap-y-2 sm:items-start">
                    <span className="sm:hidden self-center text-sm font-medium text-gray-700">
                      Actividad {index + 1}
                    </span>
                    <div className="min-w-0 col-span-2 sm:col-span-1 order-3 sm:order-none">
                      <input
                        id={`activity-${index}-name`}
                        type="text"
                        placeholder="Nombre de la actividad"
                        aria-label={`Nombre de la actividad ${index + 1}`}
                        aria-invalid={nameError ? true : undefined}
                        aria-describedby={nameError ? nameErrorId : undefined}
                        {...register(`activities.${index}.name`, {
                          required: "Este campo es requerido",
                          validate: (value) => (value ?? "").trim().length > 0 || "Este campo es requerido",
                        })}
                        className={fieldClass(!!nameError)}
                      />
                      {nameError && (
                        <span id={nameErrorId} className={errorClass}>
                          {nameError.message}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 col-span-2 sm:col-span-1 order-4 sm:order-none">
                      <input
                        id={`activity-${index}-percentage`}
                        type="number"
                        inputMode="decimal"
                        max={100}
                        min={0.01}
                        step={0.01}
                        placeholder="% ej. 25"
                        aria-label={`Porcentaje de la actividad ${index + 1}`}
                        aria-invalid={percentageError ? true : undefined}
                        aria-describedby={percentageError ? percentageErrorId : undefined}
                        {...percentageField}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const normalized = normalizeLeadingZero(raw);
                          if (normalized !== raw) e.target.value = normalized;
                          percentageField.onChange(e);
                        }}
                        className={`${fieldClass(!!percentageError)} [color-scheme:light]`}
                      />
                      {percentageError && (
                        <span id={percentageErrorId} className={errorClass}>
                          {percentageError.message}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label={`Eliminar actividad ${index + 1}`}
                      className="btn btn-sm btn-error size-10 min-h-10 p-0 order-2 sm:order-none justify-self-end">
                      <IconTrash size={16} />
                    </button>
                  </div>
                  {gradeCount != null && gradeCount > 0 && (
                    <span className="text-xs text-darkpink flex items-center gap-1">
                      <IconAlertTriangle size={14} />
                      Esta actividad tiene {gradeCount} nota(s) registrada(s). Editar o
                      eliminarla también afecta esas notas.
                    </span>
                  )}
                </li>
              );
            })}
            {fields.length === 0 && (
              <li className="text-gray-400 text-sm">Sin actividades. Agrega al menos una.</li>
            )}
          </ul>
        </div>

        {validationError && (
          <span role="alert" className="text-error text-sm mt-1 pl-1">
            {validationError}
          </span>
        )}

        {/* Sticky inside the card: the card only uses overflow-x-clip (not a
            scroll container), so sticky resolves against the page scroll. */}
        <div className="sticky bottom-0 z-10 -mx-3 sm:-mx-6 md:-mx-10 -mb-3 sm:-mb-6 md:-mb-10 mt-2 rounded-b-lg border-t border-gray-200 bg-white/95 px-3 sm:px-6 md:px-10 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => confirmLeave(() => onCancel())}
              disabled={saving}
              className="btn bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-base flex-1">
              Cancelar
            </button>
            <LoadingButton
              type="submit"
              loading={saving}
              loadingText="Guardando…"
              className="btn bg-darkpink hover:bg-darkpink/80 text-white text-base flex-1 disabled:bg-darkpink disabled:text-white disabled:opacity-70">
              Guardar
            </LoadingButton>
          </div>
        </div>
      </form>
    </div>
  );
}

export default SectionForm;
