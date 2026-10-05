"use client";

import { gradeByEnrollment } from "@/redux/service/gradeService";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { IconListDetails, IconStarsFilled } from "@tabler/icons-react";
import { useEffect } from "react";
import { calculateWeightedAverage } from "@/utils/gradeAverage";
import { usePagedList } from "../ui/usePagedList";
import { ShowMore } from "../ui/ShowMore";
import { roundGrade } from "./summaryHelpers";

// All activities fit in the card; only page when the list is unusually long.
const PAGE_SIZE = 30;

// Grade scale (0-20): >= 15 green, 11-14.99 amber, < 11 red.
function gradeChipClass(grade: number | null): string {
  if (grade === null) return "bg-gray-100 text-gray-500 border-gray-200";
  if (grade >= 15) return "bg-emerald-50 text-emerald-700 border-emerald-300";
  if (grade >= 11) return "bg-amber-50 text-amber-700 border-amber-300";
  return "bg-red-50 text-red-700 border-red-300";
}

function parseGrade(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function GradeChip({ grade: rawGrade }: { grade: number | null }) {
  // Colour band and label both come from the 1-decimal value that is shown,
  // so 14.96 renders as "15" in the passing colour, never "15.0" in amber.
  const grade = rawGrade === null ? null : roundGrade(rawGrade, 1);
  return (
    <span
      className={`inline-flex min-w-12 items-center justify-center rounded-full border px-2.5 py-0.5 text-sm font-semibold whitespace-nowrap ${gradeChipClass(grade)}`}>
      {grade === null ? "—" : grade.toFixed(grade % 1 === 0 ? 0 : 1)}
      {grade === null && <span className="sr-only">Sin nota</span>}
    </span>
  );
}

const TABLE_GRID = "grid grid-cols-[minmax(0,1fr)_5rem_5rem_5rem] items-center gap-x-3";

export function NotasCard() {
  const dispatch = useAppDispatch();
  const enrollmentView = useAppSelector((state) => state.enrollment.enrollmentView);
  const gradesUser = useAppSelector((state) => state.grade.gradesUser);
  const gradeStatus = useAppSelector((state) => state.grade?.status);

  useEffect(() => {
    if (enrollmentView) {
      dispatch(gradeByEnrollment(enrollmentView?.id));
    }
  }, [dispatch, enrollmentView]);

  const { visible, total, shown, remaining, showMore } = usePagedList(
    gradesUser,
    PAGE_SIZE,
    String(enrollmentView?.id ?? ""),
  );

  // Weighted average shared with SummaryTiles: only graded activities contribute.
  const average = calculateWeightedAverage(gradesUser);

  const rows = visible.map((g) => {
    const grade = parseGrade(g.grade);
    const weight = Number(g.activity?.percentage) || 0;
    return {
      id: g.id_activity,
      name: g.activity?.name ?? "Actividad",
      weight,
      grade,
      contribution: grade === null ? null : (grade * weight) / 100,
    };
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col h-full overflow-x-clip">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-700">Detalle de Notas</h3>
        <IconListDetails size={24} className="text-gray-400 shrink-0" />
      </div>
      <div className="flex-grow flex flex-col gap-3">
        {gradeStatus === "loading" ? (
          <div className="flex justify-center items-center h-full py-8">
            <span className="loading loading-spinner text-gray-300"></span>
          </div>
        ) : gradesUser.length > 0 ? (
          <>
            {/* md+: compact table */}
            <div className="hidden md:block" role="table" aria-label="Detalle de notas">
              <div
                role="row"
                className={`${TABLE_GRID} px-3 pb-2 text-xs font-medium uppercase tracking-wide text-gray-500 border-b border-gray-100`}>
                <span role="columnheader">Actividad</span>
                <span role="columnheader" className="text-right">Peso</span>
                <span role="columnheader" className="text-center">Nota</span>
                <span role="columnheader" className="text-right">Aporte</span>
              </div>
              {rows.map((r) => (
                <div
                  key={r.id}
                  role="row"
                  className={`${TABLE_GRID} min-h-11 px-3 py-2 border-b border-gray-50 text-sm hover:bg-gray-50`}>
                  <span role="cell" className="min-w-0 break-words text-gray-800">{r.name}</span>
                  <span role="cell" className="text-right text-gray-500">{r.weight}%</span>
                  <span role="cell" className="text-center"><GradeChip grade={r.grade} /></span>
                  <span role="cell" className="text-right font-medium text-gray-700">
                    {r.contribution === null ? "—" : r.contribution.toFixed(2)}
                  </span>
                </div>
              ))}
              <div
                role="row"
                className={`${TABLE_GRID} px-3 py-3 mt-1 rounded-lg bg-gray-50 text-sm font-semibold text-gray-800`}>
                <span role="cell" className="col-span-3">Promedio ponderado</span>
                <span role="cell" className="text-right">{average === null ? "—" : average.toFixed(1)}</span>
              </div>
            </div>

            {/* mobile: compact two-line rows */}
            <ul className="flex flex-col gap-1.5 md:hidden">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 min-h-12 rounded-lg bg-gray-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 break-words">{r.name}</p>
                    <p className="text-xs text-gray-500">
                      Peso {r.weight}%
                      {r.contribution !== null && ` · Aporte ${r.contribution.toFixed(2)}`}
                    </p>
                  </div>
                  <GradeChip grade={r.grade} />
                </li>
              ))}
              <li className="flex items-center justify-between gap-3 rounded-lg bg-lightpink/40 px-3 py-3 text-sm font-semibold text-gray-800">
                <span>Promedio ponderado</span>
                <span>{average === null ? "—" : average.toFixed(1)}</span>
              </li>
            </ul>

            <p className="text-xs text-gray-500">
              Solo cuentan las actividades con nota. Aporte = nota × peso / 100.
            </p>
            {total > PAGE_SIZE && (
              <ShowMore className="mt-2" shown={shown} total={total} remaining={remaining} onClick={showMore} />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
            <IconStarsFilled size={40} className="text-gray-200" />
            <div>
              <p className="font-medium text-gray-500">Sin notas registradas</p>
              <p className="text-sm text-gray-500 mt-1">Las notas aparecerán aquí cuando estén disponibles.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
