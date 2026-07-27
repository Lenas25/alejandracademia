"use client";

import { updateGrade } from "@/redux/service/gradeService";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { Activity } from "@/types/activity";
import { Section } from "@/types/section";
import { Enrollment } from "@/types/enrollment";
import { useEffect, useMemo, useState } from "react"; // Se importa useMemo
import { useForm } from "react-hook-form";
import { fetchEnrollment } from "@/redux/service/enrollmentService";
import { IconSearch } from "@tabler/icons-react";
import { useDebounce } from "@/hooks/useDebounce";
import { User } from "@/types/user";
import { normalizeLeadingZero } from "@/utils/numberInput";

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

function RowStudents({ selectedSection, selectedActivity }: RowStudentsProps) {
  const dispatch = useAppDispatch();
  const allGrades = useAppSelector((state) => state.grade.grades);
  const enrollments = useAppSelector((state) => state.enrollment.enrollments);

  const [message, setMessage] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

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
    reset, // Se importa el método reset
    getValues, // Útil para obtener valores sin disparar un render
  } = useForm<GradeForm>({
    defaultValues, // Se inicializa con los valores memoizados
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  // Efecto para el mensaje
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const onSubmit = async (data: GradeForm) => {
    try {
      const dataSend = {
        id_activity: selectedActivity?.id ?? 0,
        grades: data.grades.map((gr) => {
          const parsedGrade = Number(gr.grade);
          return {
            // Usamos 'data.grades'
            id_enrollment: Number(gr.id_enrollment),
            // Field may be blank mid-edit (allowed so the user can clear it
            // without a 0 being forced in); coerce to 0 only now, at submit
            // time.
            grade: Number.isFinite(parsedGrade) ? parsedGrade : 0,
          };
        }),
      };

      await dispatch(
        updateGrade({ courseId: selectedSection?.id, data: dataSend }),
      );

      // La recarga de datos es mejor manejarla con el resultado del thunk
      if (selectedSection) {
        dispatch(fetchEnrollment({ courseId: selectedSection.id }));
      }
      setMessage("Notas guardadas correctamente");
      setHasChanges(false);
    } catch {
      setMessage("Error al guardar las notas");
    }
  };

  const handleGradeChange = (index: number, value: number) => {
    // Es mejor usar getValues para evitar problemas de "stale state"
    const currentGrade = getValues(`grades.${index}.grade`);
    if (currentGrade !== value) {
      setValue(`grades.${index}.grade`, value, { shouldDirty: true });
      setHasChanges(true);
    }
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

  const saveButton = hasChanges && (
    <button
      type="submit"
      className="btn btn-sm bg-darkpink text-white border-none hover:bg-black w-full sm:w-auto"
    >
      Guardar cambios
    </button>
  );

  return (
    selectedSection &&
    selectedActivity && (
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-black">
          {selectedActivity?.name}
        </h3>
        {message && (
          <div
            className={`alert ${
              message.includes("Error") ? "alert-error" : "alert-success"
            } my-5 text-white`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Search + top Guardar so the action stays reachable above a long
              roster, not only at the bottom of the list. */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar alumno..."
                className="input input-bordered w-full bg-white text-black"
              />
              <IconSearch className="absolute right-3 top-2 text-gray-400" />
            </div>
            {saveButton}
          </div>

          {/* Responsive "table": one DOM node per field (each grade input
              registers exactly once via `originalIndex`) that is laid out
              as a real table on md+ screens and as stacked label/value
              cards on mobile (<768px), purely via `md:table*` display
              utilities — avoids binding the same react-hook-form field to
              two different DOM nodes across breakpoints, which would
              desync the field's tracked value. */}
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
                className="flex flex-col gap-3 md:table-row-group md:gap-0"
              >
                {filteredStudents.map(({ gr, originalIndex }) => {
                  const userInfo = Array.isArray(gr.enrollment.user)
                    ? gr.enrollment.user[0]
                    : gr.enrollment.user;
                  return (
                    <div
                      key={gr.id_enrollment}
                      role="row"
                      className="flex flex-col gap-3 border border-grey rounded-lg p-3 bg-white md:table-row md:border-0 md:rounded-none md:p-0 md:bg-transparent md:hover:bg-lightpink/40"
                    >
                      <div
                        role="cell"
                        className="flex items-center justify-between gap-2 md:table-cell md:border-b md:border-grey md:px-3 md:py-3 md:align-middle"
                      >
                        <span className="text-xs text-gray-500 md:hidden">
                          DNI
                        </span>
                        <span
                          className="text-black truncate block max-w-[8rem] md:max-w-[9rem]"
                          title={String(userInfo?.id ?? "")}
                        >
                          {userInfo?.id}
                        </span>
                      </div>
                      <div
                        role="cell"
                        className="flex items-center justify-between gap-2 md:table-cell md:border-b md:border-grey md:px-3 md:py-3 md:align-middle"
                      >
                        <span className="text-xs text-gray-500 md:hidden">
                          Nombre
                        </span>
                        <span className="text-black break-words text-right md:text-left">
                          {userInfo?.name} {userInfo?.lastName}
                        </span>
                      </div>
                      <div
                        role="cell"
                        className="flex items-center justify-between gap-2 md:table-cell md:border-b md:border-grey md:px-3 md:py-3 md:align-middle"
                      >
                        <span className="text-xs text-gray-500 md:hidden">
                          Nota
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="20"
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
                            handleGradeChange(
                              originalIndex,
                              normalized === "" ? NaN : Number(normalized),
                            );
                          }}
                          className="input input-bordered w-24 bg-white text-black"
                        />
                      </div>
                      <div
                        role="cell"
                        className="flex items-center justify-between gap-2 md:table-cell md:border-b md:border-grey md:px-3 md:py-3 md:align-middle"
                      >
                        <span className="text-xs text-gray-500 md:hidden">
                          Promedio actual
                        </span>
                        <span className="text-sm text-gray-400">
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

          {saveButton && <div className="flex justify-end">{saveButton}</div>}
        </form>
      </div>
    )
  );
}

export default RowStudents;
