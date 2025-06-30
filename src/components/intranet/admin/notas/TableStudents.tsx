"use client";

import { useAppSelector } from "@/redux/stores";

export function TableStudents() {
  const enrollments = useAppSelector((state) => state.enrollment.enrollments);
  return (
    <>
      <div className="flex flex-col gap-5 bg-white rounded-lg shadow p-6  mb-5">
        <div className="flex flex-wrap gap-5 w-full justify-between">
          <h2 className="text-2xl font-semisemibold">Estudiantes Inscritos</h2>
          <div className="flex gap-2 items-center">
            {enrollments.length > 0 ? (
              <p className="text-gray-500">
                {enrollments.length} estudiante(s) inscrito(s)
              </p>
            ) : (
              <p className="text-gray-500">No hay estudiantes inscritos</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between px-4">
          <p className="font-semisemibold">Nombre</p>
          <p className="font-semisemibold">Nota Final</p>
        </div>
        {enrollments.map((enrollment) => (
          <div
            key={enrollment.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:bg-gray-300 transition-colors border-gray-200 border">
            <p className="text-lg font-medium">
              {Array.isArray(enrollment.user)
                ? enrollment.user.map((u) => u.name).join(", ")
                : enrollment.user?.name}
            </p>
            <p className="text-gray-600">{enrollment.final_grade}</p>
          </div>
        ))}
      </div>
    </>
  );
}
