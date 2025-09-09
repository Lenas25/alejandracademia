"use client";

import { updateGrade } from "@/redux/service/gradeService";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { Activity } from "@/types/activity";
import { Course } from "@/types/course";
import { Enrollment } from "@/types/enrollment";
import { useEffect, useMemo, useState } from "react"; // Se importa useMemo
import { useForm } from "react-hook-form";
import { fetchEnrollment } from "@/redux/service/enrollmentService";
import { IconSearch } from "@tabler/icons-react";
import { useDebounce } from "@/hooks/useDebounce";
import { User } from "@/types/user";

interface RowStudentsProps {
  selectedCourse: Course | null;
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

function RowStudents({ selectedCourse, selectedActivity }: RowStudentsProps) {
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

  const defaultValues = useMemo(() => ({
    grades: enrollments.map((enrollment) => {
      const grade = gradesPerActivity.find(
        (g) => g.id_enrollment === enrollment.id
      );
      return {
        id_activity: selectedActivity?.id ?? 0,
        id_enrollment: enrollment.id,
        grade: grade ? Number(grade.grade) : 0, // Asegurarse de que sea número
        enrollment: enrollment,
      };
    }),
  }), [enrollments, gradesPerActivity, selectedActivity?.id]);

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
        grades: data.grades.map((gr) => ({
          // Usamos 'data.grades'
          id_enrollment: Number(gr.id_enrollment),
          grade: Number(gr.grade),
        })),
      };

      await dispatch(
        updateGrade({ courseId: selectedCourse?.id, data: dataSend })
      );

      // La recarga de datos es mejor manejarla con el resultado del thunk
      if (selectedCourse) {
        dispatch(fetchEnrollment({ courseId: selectedCourse.id }));
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

  // 4. MEMOIZAR LA LISTA FILTRADA PARA MEJORAR RENDIMIENTO
  const filteredStudents = useMemo(() => {
    // Si no hay término de búsqueda, devuelve todos los estudiantes sin filtrar.
    if (!searchTerm) {
      return defaultValues.grades;
    }

    const searchStr = searchTerm.toLowerCase();
    const fieldsToSearch: (keyof User)[] = ["id", "name", "lastName"];

    return defaultValues.grades.filter((gr) => {
      const userInfo = Array.isArray(gr.enrollment.user)
        ? gr.enrollment.user[0]
        : gr.enrollment.user;

      if (!userInfo) {
        return false;
      }

      // 'some' comprueba si al menos uno de los campos cumple la condición.
      // Es más limpio y escalable si quieres añadir más campos (ej. email).
      return fieldsToSearch.some(field => 
        String(userInfo[field] ?? '') // Usa String() para manejar 'id' (número) y '??' para valores nulos
            .toLowerCase()
            .includes(searchStr)
      );
    });
    // La dependencia ahora es el valor "debounced", no el instantáneo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues.grades, debouncedSearch]);

  return (
    selectedCourse &&
    selectedActivity && (
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semisemibold">{selectedActivity?.name}</h3>
        {message && (
          <div
            className={`alert ${
              message.includes("Error") ? "alert-error" : "alert-success"
            } my-5 text-white`}>
            {message}
          </div>
        )}

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar alumno..."
            className="input-search"
          />
          <IconSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <table className="table">
              {/* ... (thead) ... */}
              <thead>
                <tr>
                  <th>DNI</th>
                  <th>Nombre</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {/* 5. Iterar sobre el array de campos del formulario */}
                {filteredStudents.map((gr, index) => (
                  <tr key={gr.id_enrollment}>
                    <td>
                      {Array.isArray(gr.enrollment.user)
                        ? gr.enrollment.user[0]?.id
                        : gr.enrollment.user?.id}
                    </td>
                    <td>
                      {Array.isArray(gr.enrollment.user)
                        ? `${gr.enrollment.user[0]?.name} ${gr.enrollment.user[0]?.lastName}`
                        : `${gr.enrollment.user?.name} ${gr.enrollment.user?.lastName}`}
                    </td>
                    <td className="w-32">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        {...register(`grades.${index}.grade`, {
                          valueAsNumber: true,
                        })}
                        onChange={(e) =>
                          handleGradeChange(index, Number(e.target.value))
                        }
                        className="input input-bordered w-full bg-white"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasChanges && (
            <button type="submit" className="btn btn-primary w-full mt-4 bg-black text-white border-none hover:bg-darkpink">
              Guardar Cambios
            </button>
          )}
        </form>
      </div>
    )
  );
}

export default RowStudents;
