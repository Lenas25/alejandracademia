"use client";

import { useAppSelector } from "@/redux/stores";
import type { Enrollment } from "@/types/enrollment";

// Read-only "Notas" view: each enrolled student's backend-computed final
// grade (weighted running average). Mirrors RowStudents' responsive-table
// layout (same `table-scroll` + `md:table*` structure, headers and row
// borders) so switching the Calificar/Notas toggle keeps one consistent
// visual container — no nested card, no per-activity breakdown, no editing.

function getUser(enrollment: Enrollment) {
  return Array.isArray(enrollment.user) ? enrollment.user[0] : enrollment.user;
}

export function TableStudents() {
  const enrollments = useAppSelector((state) => state.enrollment.enrollments);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-black">Estudiantes Inscritos</h3>
        <span className="badge bg-lightpink text-darkpink border-none font-medium">
          {enrollments.length} inscrito(s)
        </span>
      </div>

      <div className="table-scroll">
        <div role="table" aria-label="Notas finales por estudiante" className="w-full md:table">
          <div role="rowgroup" className="hidden md:table-header-group">
            <div role="row" className="md:table-row text-xs uppercase tracking-wide text-gray-500 whitespace-nowrap">
              <div role="columnheader" className="md:table-cell bg-grey/40 px-3 py-2 w-36">
                DNI
              </div>
              <div role="columnheader" className="md:table-cell bg-grey/40 px-3 py-2 w-full">
                Nombre
              </div>
              <div role="columnheader" className="md:table-cell bg-grey/40 px-3 py-2 w-36">
                Nota Final
              </div>
            </div>
          </div>

          <div role="rowgroup" className="flex flex-col gap-3 md:table-row-group md:gap-0">
            {enrollments.map((enrollment) => {
              const user = getUser(enrollment);
              const grade = Number(enrollment.final_grade);
              return (
                <div
                  key={enrollment.id}
                  role="row"
                  className="flex flex-col gap-3 border border-grey rounded-lg p-3 bg-white md:table-row md:border-0 md:rounded-none md:p-0 md:bg-transparent md:hover:bg-lightpink/40">
                  <div
                    role="cell"
                    className="flex items-center justify-between gap-2 md:table-cell md:border-b md:border-grey md:px-3 md:py-3 md:align-middle">
                    <span className="text-xs text-gray-500 md:hidden">DNI</span>
                    <span
                      className="text-black truncate block max-w-[8rem] md:max-w-[9rem]"
                      title={String(user?.id ?? "")}
                    >
                      {user?.id}
                    </span>
                  </div>
                  <div
                    role="cell"
                    className="flex items-center justify-between gap-2 md:table-cell md:border-b md:border-grey md:px-3 md:py-3 md:align-middle">
                    <span className="text-xs text-gray-500 md:hidden">Nombre</span>
                    <span className="text-black break-words text-right md:text-left">
                      {user?.name} {user?.lastName}
                    </span>
                  </div>
                  <div
                    role="cell"
                    className="flex items-center justify-between gap-2 md:table-cell md:border-b md:border-grey md:px-3 md:py-3 md:align-middle">
                    <span className="text-xs text-gray-500 md:hidden">Nota Final</span>
                    <span className="font-semibold text-black tabular-nums">
                      {Number.isFinite(grade) ? grade.toFixed(2) : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {enrollments.length === 0 && (
        <p className="text-center py-6 text-gray-400">No hay estudiantes inscritos</p>
      )}
    </div>
  );
}
