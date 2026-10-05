"use client";

import { fetchMyAttendance } from "@/redux/service/attendanceService";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { IconCalendarCheck, IconClipboardX } from "@tabler/icons-react";
import { useEffect } from "react";
import { AsistenciaGrid, formatDayDate } from "./AsistenciaGrid";

// Alumno Read-Only Mi Asistencia. Follows `NotasCard`/`CuotasCard`'s
// conventions exactly (card shell, spinner, icon empty state) and the same
// current-enrollment scoping idiom (`enrollmentView.id` →
// `fetchMyAttendance`, mirroring `gradeByEnrollment`/`fetchMyInstallments`).
// Threshold (< 70%) mirrors the admin Métricas tab's
// `LOW_ATTENDANCE_THRESHOLD` (AsistenciaTab.tsx). Read-only: no edit
// controls are rendered.

const LOW_ATTENDANCE_THRESHOLD = 70;

export function AsistenciaCard() {
  const dispatch = useAppDispatch();
  const enrollmentView = useAppSelector((state) => state.enrollment.enrollmentView);
  const myAttendance = useAppSelector((state) => state.attendance.myAttendance);
  const myAttendanceStatus = useAppSelector((state) => state.attendance.myAttendanceStatus);
  const myAttendanceError = useAppSelector((state) => state.attendance.myAttendanceError);

  useEffect(() => {
    if (enrollmentView) {
      dispatch(fetchMyAttendance(enrollmentView.id));
    }
  }, [dispatch, enrollmentView]);

  const days = myAttendance?.days ?? [];
  const absences = days.filter((d) => !d.present);

  const hasData = myAttendance !== null && myAttendance.totalDays > 0;
  const heroColor = !hasData
    ? "text-gray-400"
    : myAttendance!.percentage < LOW_ATTENDANCE_THRESHOLD
      ? "text-yellow"
      : "text-darkpink";

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col h-full overflow-x-clip">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-700">Mi Asistencia</h3>
        <IconCalendarCheck size={24} className="text-gray-400 shrink-0" />
      </div>

      {myAttendanceStatus === "loading" ? (
        <div className="flex-grow flex justify-center items-center h-full py-8">
          <span className="loading loading-spinner text-darkpink"></span>
        </div>
      ) : myAttendanceStatus === "failed" ? (
        <div className="flex-grow flex flex-col items-center justify-center h-full gap-3 text-center py-8">
          <div role="alert" className="alert alert-error text-white">
            <span>{myAttendanceError || "No se pudo cargar la asistencia"}</span>
          </div>
          <button
            type="button"
            onClick={() => enrollmentView && dispatch(fetchMyAttendance(enrollmentView.id))}
            className="btn btn-sm h-10 min-h-10 bg-darkpink text-white border-none hover:bg-black">
            Reintentar
          </button>
        </div>
      ) : !hasData ? (
        <div className="flex-grow flex flex-col items-center justify-center h-full gap-3 text-center py-8">
          <IconClipboardX size={40} className="text-gray-200" />
          <div>
            <p className="font-medium text-gray-500">Sin asistencia registrada aún</p>
            <p className="text-sm text-gray-500 mt-1">Tu asistencia aparecerá aquí cuando esté disponible.</p>
          </div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col gap-4">
          <div className="flex flex-col items-center gap-1 py-2">
            <span className={`text-3xl sm:text-4xl font-bold ${heroColor}`}>
              {myAttendance!.percentage}%
            </span>
            <p className="text-sm text-gray-500">
              {myAttendance!.presentDays}/{myAttendance!.totalDays} días presentes
            </p>
          </div>

          <AsistenciaGrid days={days} resetKey={String(enrollmentView?.id ?? "")} />

          <div className="flex flex-col gap-2">
            {absences.length === 0 ? (
              <p className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                Sin ausencias. ¡Sigue así!
              </p>
            ) : (
              <>
                <h4 className="text-sm font-medium text-gray-700">Ausencias ({absences.length})</h4>
                <ul className="flex flex-wrap gap-2">
                  {absences.map((d) => (
                    <li
                      key={d.date}
                      className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-700">
                      {formatDayDate(d.date)}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
