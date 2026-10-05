"use client";

import { fetchGrade, updateGrade } from "@/redux/service/gradeService";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { Activity } from "@/types/activity";
import { Section } from "@/types/section";
import { Enrollment } from "@/types/enrollment";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { fetchEnrollment } from "@/redux/service/enrollmentService";
import { IconSearch } from "@tabler/icons-react";
import { useDebounce } from "@/hooks/useDebounce";
import { User } from "@/types/user";
import { normalizeLeadingZero } from "@/utils/numberInput";
import { LoadingButton } from "@/components/intranet/ui/LoadingButton";
import { useToast } from "@/components/intranet/ui/Toast";

interface RowStudentsProps {
  selectedSection: Section | null;
  selectedActivity: Activity | null;
}

type GradeForm = {
  grades: {
    id_activity: number;
    id_enrollment: number;
    grade: number;
    enrollment: Enrollment;
  }[];
};

// Grade rules. The backend stores `decimal(4,2)` and its DTO only checks
// `@IsNumber()` (no explicit range), so the 0–20 scale is the product rule
// enforced here (the input already declared min=0 / max=20).
const MIN_GRADE = 0;
const MAX_GRADE = 20;

// Returns a short Spanish error, or null when the value is a valid grade.
function validateGrade(value: number): string | null {
  if (!Number.isFinite(value)) return "Ingresa una nota";
  if (value < MIN_GRADE || value > MAX_GRADE) return `Entre ${MIN_GRADE} y ${MAX_GRADE}`;
  // At most 2 decimals (tolerant to binary floating point noise).
  if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-6) return "Máx. 2 decimales";
  return null;
}

function RowStudents({ selectedSection, selectedActivity }: RowStudentsProps) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const allGrades = useAppSelector((state) => state.grade.grades);
  const enrollments = useAppSelector((state) => state.enrollment.enrollments);

  // Enrollment ids whose current value differs from the saved one.
  const [changedIds, setChangedIds] = useState<Record<number, true>>({});
  // Inline validation errors keyed by enrollment id.
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const changedCount = Object.keys(changedIds).length;

  const gradesPerActivity = useMemo(() => {
    if (!selectedActivity) return [];
    return allGrades.filter((gr) => gr.id_activity === selectedActivity.id);
  }, [allGrades, selectedActivity]);

  const defaultValues = useMemo(
    () => ({
      grades: enrollments.map((enrollment) => {
        const grade = gradesPerActivity.find(
          (g) => g.id_enrollment === enrollment.id,
        );
        return {
          id_activity: selectedActivity?.id ?? 0,
          id_enrollment: enrollment.id,
          grade: grade ? Number(grade.grade) : 0, // Asegurarse de que sea número
          enrollment: enrollment,
        };
      }),
    }),
    [enrollments, gradesPerActivity, selectedActivity?.id],
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
    reset, // Se importa el método reset
    getValues, // Útil para obtener valores sin disparar un render
  } = useForm<GradeForm>({
    defaultValues, // Se inicializa con los valores memoizados
  });

  useEffect(() => {
    reset(defaultValues);
    setChangedIds({});
    setFieldErrors({});
  }, [defaultValues, reset]);

  useEffect(
    () => () => {
      if (focusTimer.current) clearTimeout(focusTimer.current);
    },
    [],
  );

  const focusGradeInput = (enrollmentId: number) => {
    const el = document.getElementById(`grade-input-${enrollmentId}`);
    if (!el) return;
    el.scrollIntoView({ block: "center" });
    el.focus({ preventScroll: true });
  };

  const onSubmit = async (data: GradeForm) => {
    // Validate every row (not just the visible ones) before touching the API.
    const errors: Record<number, string> = {};
    let firstInvalidId: number | null = null;
    // Only rows the user actually changed are validated, so untouched legacy
    // grades (out of range / 3+ decimals) never block saving other rows.
    // A cleared field is NaN, which never equals the original -> validated.
    for (const [index, gr] of data.grades.entries()) {
      const value = Number(gr.grade);
      const original = defaultValues.grades[index]?.grade;
      if (typeof original === "number" && original === value) continue;
      const error = validateGrade(value);
      if (error) {
        errors[gr.id_enrollment] = error;
        if (firstInvalidId === null) firstInvalidId = gr.id_enrollment;
      }
    }
    setFieldErrors(errors);

    const invalidCount = Object.keys(errors).length;
    if (invalidCount > 0 && firstInvalidId !== null) {
      toast.error(
        `${invalidCount} ${invalidCount === 1 ? "nota inválida" : "notas inválidas"}. Corrige los campos marcados antes de guardar.`,
      );
      const targetId: number = firstInvalidId;
      const isVisible = filteredStudents.some(({ gr }) => gr.id_enrollment === targetId);
      if (isVisible) {
        focusGradeInput(targetId);
      } else {
        // The search filter is hiding the invalid row: clear it, then wait
        // for the debounced filter to catch up before focusing.
        setSearchTerm("");
        if (focusTimer.current) clearTimeout(focusTimer.current);
        focusTimer.current = setTimeout(() => focusGradeInput(targetId), 400);
      }
      return;
    }

    const dataSend = {
      id_activity: selectedActivity?.id ?? 0,
      grades: data.grades.map((gr) => ({
        id_enrollment: Number(gr.id_enrollment),
        grade: Number(gr.grade),
      })),
    };

    const resultAction = await dispatch(
      updateGrade({ courseId: selectedSection?.id, data: dataSend }),
    );

    if (updateGrade.fulfilled.match(resultAction)) {
      // Refresh the grades slice and wait for it: defaultValues derive from
      // it, so the form must not reset (or compare) against the OLD grades.
      const [gradeAction] = await Promise.all([
        selectedActivity?.id !== undefined
          ? dispatch(fetchGrade(selectedActivity.id))
          : Promise.resolve(null),
        selectedSection
          ? dispatch(fetchEnrollment({ courseId: selectedSection.id }))
          : Promise.resolve(null),
      ]);
      toast.success(resultAction.payload.message || "Notas guardadas correctamente");
      // Clear the "N notas modificadas" bar only when the refreshed grades
      // landed; otherwise the baseline is still stale and the bar stays true.
      if (!gradeAction || fetchGrade.fulfilled.match(gradeAction)) {
        setChangedIds({});
      }
    } else {
      toast.error(
        typeof resultAction.payload === "string" && resultAction.payload
          ? resultAction.payload
          : "No se pudieron guardar las notas",
      );
    }
  };

  const handleGradeChange = (index: number, enrollmentId: number, value: number) => {
    // Es mejor usar getValues para evitar problemas de "stale state"
    const currentGrade = getValues(`grades.${index}.grade`);
    // Object.is so NaN (cleared field) compares equal to itself.
    if (!Object.is(currentGrade, value)) {
      setValue(`grades.${index}.grade`, value, { shouldDirty: true });
    }
    const original = defaultValues.grades[index]?.grade;
    const isChanged = !(typeof original === "number" && original === value);
    setChangedIds((prev) => {
      if (isChanged === (enrollmentId in prev)) return prev;
      const next = { ...prev };
      if (isChanged) next[enrollmentId] = true;
      else delete next[enrollmentId];
      return next;
    });
  };

  const setRowError = (enrollmentId: number, error: string | null) => {
    setFieldErrors((prev) => {
      if ((prev[enrollmentId] ?? null) === error) return prev;
      const next = { ...prev };
      if (error) next[enrollmentId] = error;
      else delete next[enrollmentId];
      return next;
    });
  };

  // MEMOIZAR LA LISTA FILTRADA PARA MEJORAR RENDIMIENTO.
  //
  // Each entry keeps its `originalIndex` into `defaultValues.grades` (the
  // form's real field-array order) instead of the filtered array's own
  // position. Bug fix: the previous version rendered
  // `filteredStudents.map((gr, index) => ...)` and used that *filtered*
  // index directly as `grades.${index}` for register()/setValue() — once a
  // search narrowed the list, that index no longer matched the student's
  // real position in the form array, so editing a grade while a filter was
  // active silently wrote it onto a *different* student's field and
  // corrupted the save payload. Keeping the original index alongside each
  // filtered row (and using it everywhere below) fixes that without
  // touching the save payload shape.
  const filteredStudents = useMemo(() => {
    const indexed = defaultValues.grades.map((gr, originalIndex) => ({
      gr,
      originalIndex,
    }));

    // Si no hay término de búsqueda, devuelve todos los estudiantes sin filtrar.
    if (!searchTerm) {
      return indexed;
    }

    const searchStr = searchTerm.toLowerCase();
    const fieldsToSearch: (keyof User)[] = ["id", "name", "lastName"];

    return indexed.filter(({ gr }) => {
      const userInfo = Array.isArray(gr.enrollment.user)
        ? gr.enrollment.user[0]
        : gr.enrollment.user;

      if (!userInfo) {
        return false;
      }

      // 'some' comprueba si al menos uno de los campos cumple la condición.
      // Es más limpio y escalable si quieres añadir más campos (ej. email).
      return fieldsToSearch.some((field) =>
        String(userInfo[field] ?? "") // Usa String() para manejar 'id' (número) y '??' para valores nulos
          .toLowerCase()
          .includes(searchStr),
      );
    });
    // La dependencia ahora es el valor "debounced", no el instantáneo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues.grades, debouncedSearch]);

  const cellBase = "md:table-cell md:border-b md:border-grey md:px-3 md:py-3 md:align-middle";

  return (
    selectedSection &&
    selectedActivity && (
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-black break-words">
          {selectedActivity?.name}
        </h3>

        {/* noValidate: our own inline validation owns the messages; the native
            min/max/step popups would otherwise swallow the submit. */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-4"
        >
          <div className="relative">
            <label htmlFor="grade-search" className="sr-only">
              Buscar alumno
            </label>
            <input
              id="grade-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                // Enter in the search box must not submit the grades form.
                if (e.key === "Enter") e.preventDefault();
              }}
              placeholder="Buscar alumno..."
              className="input input-bordered h-11 w-full bg-white pr-10 text-black"
            />
            <IconSearch
              size={20}
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* Responsive "table": one DOM node per field (each grade input
              registers exactly once via `originalIndex`) that is laid out
              as a real table on md+ screens and as compact rows on mobile
              (<768px: name / DNI + promedio on the left, grade input on the
              right), purely via `md:table*` display utilities — avoids
              binding the same react-hook-form field to two different DOM
              nodes across breakpoints, which would desync the field's
              tracked value. */}
          <div className="table-scroll">
            <div
              role="table"
              aria-label="Notas por estudiante"
              className="w-full md:table"
            >
              <div role="rowgroup" className="hidden md:table-header-group">
                <div
                  role="row"
                  className="md:table-row text-xs uppercase tracking-wide text-gray-500 whitespace-nowrap"
                >
                  <div
                    role="columnheader"
                    className="md:table-cell bg-grey/40 px-3 py-2 w-36"
                  >
                    DNI
                  </div>
                  <div
                    role="columnheader"
                    className="md:table-cell bg-grey/40 px-3 py-2 w-full"
                  >
                    Nombre
                  </div>
                  <div
                    role="columnheader"
                    className="md:table-cell bg-grey/40 px-3 py-2 w-28"
                  >
                    Nota
                  </div>
                  <div
                    role="columnheader"
                    className="md:table-cell bg-grey/40 px-3 py-2 w-36"
                  >
                    Promedio actual
                  </div>
                </div>
              </div>

              <div
                role="rowgroup"
                className="flex flex-col gap-2 md:table-row-group md:gap-0"
              >
                {filteredStudents.map(({ gr, originalIndex }) => {
                  const userInfo = Array.isArray(gr.enrollment.user)
                    ? gr.enrollment.user[0]
                    : gr.enrollment.user;
                  const error = fieldErrors[gr.id_enrollment];
                  const inputId = `grade-input-${gr.id_enrollment}`;
                  const errorId = `${inputId}-error`;
                  return (
                    <div
                      key={gr.id_enrollment}
                      role="row"
                      className={`grid grid-cols-[auto_minmax(0,1fr)_6rem] items-center gap-x-3 gap-y-0.5 rounded-lg border p-3 bg-white md:table-row md:border-0 md:rounded-none md:p-0 md:bg-transparent md:hover:bg-lightpink/40 ${
                        error ? "border-red-300" : "border-grey"
                      }`}
                    >
                      <div
                        role="cell"
                        className={`col-start-1 row-start-2 min-w-0 ${cellBase}`}
                      >
                        <span
                          className="block break-all text-xs text-gray-500 md:text-base md:text-black md:break-normal"
                          title={String(userInfo?.id ?? "")}
                        >
                          {userInfo?.id}
                        </span>
                      </div>
                      <div
                        role="cell"
                        className={`col-span-2 col-start-1 row-start-1 min-w-0 ${cellBase}`}
                      >
                        <span className="block break-words font-medium text-black md:font-normal">
                          {userInfo?.name} {userInfo?.lastName}
                        </span>
                      </div>
                      <div
                        role="cell"
                        className={`col-start-3 row-span-2 row-start-1 flex flex-col items-end gap-1 ${cellBase}`}
                      >
                        <label htmlFor={inputId} className="sr-only">
                          Nota de {userInfo?.name} {userInfo?.lastName}
                        </label>
                        <input
                          id={inputId}
                          type="number"
                          inputMode="decimal"
                          min={MIN_GRADE}
                          max={MAX_GRADE}
                          step="0.01"
                          aria-invalid={error ? true : undefined}
                          aria-describedby={error ? errorId : undefined}
                          {...register(`grades.${originalIndex}.grade`, {
                            valueAsNumber: true,
                          })}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const normalized = normalizeLeadingZero(raw);
                            if (normalized !== raw) {
                              e.target.value = normalized;
                            }
                            const value = normalized === "" ? NaN : Number(normalized);
                            handleGradeChange(originalIndex, gr.id_enrollment, value);
                            // A blank field is only flagged on blur/submit so
                            // clearing it to retype does not flash an error.
                            setRowError(
                              gr.id_enrollment,
                              normalized === "" ? null : validateGrade(value),
                            );
                          }}
                          onBlur={(e) => {
                            const raw = e.target.value;
                            setRowError(
                              gr.id_enrollment,
                              validateGrade(raw === "" ? NaN : Number(raw)),
                            );
                          }}
                          className={`input input-bordered h-11 w-24 bg-white text-black ${
                            error ? "input-error" : ""
                          }`}
                        />
                        {error && (
                          <p
                            id={errorId}
                            className="w-24 break-words text-right text-xs leading-tight text-red-700 md:text-left"
                          >
                            {error}
                          </p>
                        )}
                      </div>
                      <div
                        role="cell"
                        className={`col-start-2 row-start-2 min-w-0 ${cellBase}`}
                      >
                        <span className="text-xs text-gray-500 md:hidden">
                          Promedio actual:{" "}
                        </span>
                        <span className="text-xs text-gray-500 tabular-nums md:text-sm md:text-gray-400">
                          {gr.enrollment.final_grade != null
                            ? Number(gr.enrollment.final_grade).toFixed(2)
                            : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {filteredStudents.length === 0 && (
            <p className="text-center py-6 text-gray-400">
              No se encontraron estudiantes
            </p>
          )}

          {/* In-flow sticky save bar (never fixed, so it cannot collide with
              the sidebar rail or the mobile hamburger). */}
          {(changedCount > 0 || isSubmitting) && (
            <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white/95 px-3 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur">
              <span className="text-sm text-gray-600" aria-live="polite">
                {changedCount} {changedCount === 1 ? "nota modificada" : "notas modificadas"}
              </span>
              <LoadingButton
                type="submit"
                loading={isSubmitting}
                loadingText="Guardando…"
                className="btn h-11 min-h-11 bg-darkpink text-white border-none hover:bg-black"
              >
                Guardar cambios
              </LoadingButton>
            </div>
          )}
        </form>
      </div>
    )
  );
}

export default RowStudents;
