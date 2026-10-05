"use client";

import { IconAlertTriangle, IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { LoadingButton } from "@/components/intranet/ui/LoadingButton";
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
    trigger,
    formState: { errors },
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
  // Suma: informational only — no longer blocks submit (requirement change).
  const sumBadgeClass =
    percentageSum === 100 ? "badge-success" : percentageSum > 100 ? "badge-warning" : "badge-neutral";

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
  const labelClass = "block text-sm text-gray-700 mb-1";
  const errorClass = "text-error text-xs mt-1 pl-1 block";

  return (
    <div className="overflow-x-clip bg-white rounded-lg shadow relative p-3 sm:p-6 md:p-10">
      <h2 className="text-2xl font-medium mb-6">
        {selectedSection ? "Editar Sección" : "Crear Sección"}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="w-full min-w-0">
            <select
              defaultValue={selectedSection?.course?.id ? String(selectedSection.course.id) : ""}
              aria-label="Curso"
              aria-invalid={errors.id_course ? true : undefined}
              aria-describedby={errors.id_course ? "section-course-error" : undefined}
              className={selectClass(!!errors.id_course)}
              {...register("id_course", { required: "Este campo es requerido" })}>
              <option disabled value="">
                Seleccione un Curso
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
            <select
              defaultValue={selectedSection?.tutor?.id ? String(selectedSection.tutor.id) : ""}
              aria-label="Tutor"
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
          <input
            type="text"
            placeholder="Nombre de la sección"
            aria-label="Nombre de la sección"
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

        <div className="flex flex-col sm:flex-row justify-between gap-3">
          {/* Label stacked above the input (not inline) so the row fits at
              360px; `min-w-0` overrides the native date input's intrinsic
              min-content width, which otherwise can force the row wider than
              the viewport. */}
          <div className="w-full min-w-0">
            <label htmlFor="section-initial-date" className={labelClass}>
              Inicio
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
              Fin
            </label>
            <input
              id="section-end-date"
              type="date"
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

        <div className="w-full max-w-xs">
          <label htmlFor="section-installments" className={labelClass}>
            Cuotas
          </label>
          <input
            id="section-installments"
            type="number"
            min={1}
            step={1}
            aria-invalid={errors.installmentsCount ? true : undefined}
            aria-describedby={errors.installmentsCount ? "section-installments-error" : undefined}
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
          {errors.installmentsCount && (
            <span id="section-installments-error" className={errorClass}>
              {errors.installmentsCount.message}
            </span>
          )}
        </div>

        <div className="mt-2">
          <div className="flex gap-3 flex-wrap justify-between items-center">
            <h4 className="font-semibold text-xl">Actividades</h4>
            <span className={`badge badge-lg ${sumBadgeClass} text-white`}>
              Suma: {percentageSum}%
            </span>
            <button
              type="button"
              ref={addActivityButtonRef}
              onClick={() => append({ name: "", percentage: "" })}
              className="btn btn-sm min-h-10 bg-darkpink border-none text-white text-base">
              Agregar <IconPlus size={16} />
            </button>
          </div>
          <ul className="flex gap-4 flex-col mt-4">
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
                <li key={field.id} className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-700">Actividad {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label={`Eliminar actividad ${index + 1}`}
                      className="btn btn-sm btn-error size-10 min-h-10 p-0">
                      <IconTrash size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_10rem] gap-3">
                    <div className="min-w-0">
                      <label htmlFor={`activity-${index}-name`} className={labelClass}>
                        Nombre
                      </label>
                      <input
                        id={`activity-${index}-name`}
                        type="text"
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
                    <div className="min-w-0">
                      <label htmlFor={`activity-${index}-percentage`} className={labelClass}>
                        Porcentaje %
                      </label>
                      <input
                        id={`activity-${index}-percentage`}
                        type="number"
                        max={100}
                        min={0.01}
                        step={0.01}
                        placeholder="ej. 25"
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

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={onCancel}
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
      </form>
    </div>
  );
}

export default SectionForm;
