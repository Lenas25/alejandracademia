"use client";

import { IconAlertTriangle, IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
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
  percentage: number;
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
    min: { value: 0, message: "Debe ser positivo" },
  });

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

  return (
    <div className="overflow-x-clip bg-white rounded-lg shadow relative p-3 sm:p-6 md:p-10">
      <h2 className="text-2xl font-medium mb-6">
        {selectedSection ? "Editar Sección" : "Crear Sección"}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 flex-wrap sm:flex-nowrap">
          <select
            defaultValue={selectedSection?.course?.id ? String(selectedSection.course.id) : ""}
            className="select select-bordered w-full bg-white text-black text-base"
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
          <select
            defaultValue={selectedSection?.tutor?.id ? String(selectedSection.tutor.id) : ""}
            className="select select-bordered w-full bg-white text-black text-base"
            {...register("id_tutor")}>
            <option value="">Sin tutor asignado</option>
            {tutors.map((tutor) => (
              <option key={tutor.id} value={tutor.id}>
                {tutor.name} {tutor.lastName}
              </option>
            ))}
          </select>
        </div>
        {errors.id_course && (
          <span className="text-error text-xs pl-1">{errors.id_course.message}</span>
        )}

        <label className="input input-bordered flex items-center gap-2 w-full bg-white text-black">
          <input
            type="text"
            className="grow"
            placeholder="Nombre de la sección"
            {...register("name", {
              required: "Este campo es requerido",
              minLength: { value: 3, message: "Debe tener al menos 3 caracteres" },
            })}
          />
        </label>
        {errors.name && <span className="text-error text-xs pl-1">{errors.name.message}</span>}

        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <label className="input input-bordered flex items-center gap-2 w-full bg-white text-black">
            <div className="label">
              <span className="label-text text-base text-gray-700">Inicio</span>
            </div>
            {/* `min-w-0` overrides the native date input's intrinsic
                min-content width — without it, a `grow` flex child can
                refuse to shrink below that browser default and force the
                row (and page) wider than the viewport. */}
            <input
              type="date"
              className="grow min-w-0 [color-scheme:light]"
              {...register("initialDate", { required: "Este campo es requerido" })}
            />
          </label>
          <label className="input input-bordered flex items-center gap-2 w-full bg-white text-black">
            <div className="label">
              <span className="label-text text-base text-gray-700">Fin</span>
            </div>
            <input
              type="date"
              className="grow min-w-0 [color-scheme:light]"
              {...register("endDate", { required: "Este campo es requerido" })}
            />
          </label>
        </div>
        {(errors.initialDate || errors.endDate) && (
          <span className="text-error text-xs pl-1">
            {errors.initialDate?.message || errors.endDate?.message}
          </span>
        )}

        <label className="input input-bordered flex items-center gap-2 w-full max-w-xs bg-white text-black">
          <div className="label">
            <span className="label-text text-base text-gray-700">Cuotas</span>
          </div>
          <input
            type="number"
            min={0}
            className="grow [color-scheme:light]"
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
        </label>
        {errors.installmentsCount && (
          <span className="text-error text-xs pl-1">{errors.installmentsCount.message}</span>
        )}

        <div className="mt-2">
          <div className="flex gap-3 flex-wrap justify-between items-center">
            <h4 className="font-semibold text-xl">Actividades</h4>
            <span className={`badge badge-lg ${sumBadgeClass} text-white`}>
              Suma: {percentageSum}%
            </span>
            <button
              type="button"
              onClick={() => append({ name: "", percentage: 0 })}
              className="btn btn-sm bg-darkpink border-none text-white text-base">
              Agregar <IconPlus size={16} />
            </button>
          </div>
          <ul className="flex gap-2 flex-col mt-4">
            {fields.map((field, index) => {
              // NOTE: `field.id` here is react-hook-form's own internal
              // field key (an auto-generated string), which SHADOWS our
              // data's `id` property — it is NOT the activity's numeric id.
              // The real persisted activity id must be read from the
              // watched form values instead.
              const activityId = watchedActivities[index]?.id;
              const gradeCount = activityId != null ? gradeCounts[activityId] : undefined;
              // Same "register once, wrap onChange" pattern as
              // installmentsCountField above — avoids re-registering (and
              // losing the `required` rule) on every keystroke.
              const percentageField = register(`activities.${index}.percentage`, {
                required: "Este campo es requerido",
              });
              return (
                <li key={field.id} className="flex flex-col gap-1">
                  <div className="flex gap-2 items-end flex-wrap">
                    <label className="form-control w-full max-w-xs">
                      <div className="label">
                        <span className="label-text text-gray-700">Nombre</span>
                      </div>
                      <input
                        type="text"
                        {...register(`activities.${index}.name`, {
                          required: "Este campo es requerido",
                        })}
                        className="input input-bordered w-full bg-white text-black"
                      />
                    </label>
                    <label className="form-control w-full max-w-[10rem]">
                      <div className="label">
                        <span className="label-text text-gray-700">Porcentaje %</span>
                      </div>
                      <input
                        type="number"
                        max={100}
                        min={0}
                        step={0.01}
                        placeholder="ej. 25"
                        {...percentageField}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const normalized = normalizeLeadingZero(raw);
                          if (normalized !== raw) e.target.value = normalized;
                          percentageField.onChange(e);
                        }}
                        className="input input-bordered w-full bg-white text-black [color-scheme:light]"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="btn btn-sm btn-error mb-1">
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
          <span className="text-error text-sm mt-1 pl-1">{validationError}</span>
        )}

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-base flex-1">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn bg-darkpink hover:bg-darkpink/80 text-white text-base flex-1 disabled:bg-darkpink disabled:text-white disabled:opacity-70">
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SectionForm;
