"use client";

import { useEffect, useMemo, useState } from "react";
import { LoadingButton } from "@/components/intranet/ui/LoadingButton";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import {
  createAttendanceDay,
  deleteAttendanceDay,
  fetchAttendanceDay,
  fetchAttendanceDays,
  fetchAttendanceMetrics,
  updateAttendanceDay,
} from "@/redux/service/attendanceService";
import { clearAttendanceDayDetail } from "@/redux/slices/attendanceSlice";
import { Section } from "@/types/section";
import { AttendanceMetricRow, AttendanceRecord } from "@/types/attendance";
import {
  IconCalendarPlus,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import TabHeader from "./TabHeader";

interface AsistenciaTabProps {
  selectedSection: Section;
}

type ViewMode = "registro" | "metricas";

// Below this attendance percentage the Métricas table flags the row in
// yellow — informational only (spec: "informational only, do not block").
const LOW_ATTENDANCE_THRESHOLD = 70;

// Builds today's date as a YYYY-MM-DD string from *local* date parts.
// Deliberately does NOT go through `toISOString()`/UTC — that would shift
// the day near midnight in timezones ahead of UTC (locked decision: dates
// are YYYY-MM-DD strings end-to-end, never a `Date` conversion).
function getTodayLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Formats a YYYY-MM-DD string as DD/MM/YYYY for display — plain string
// manipulation, never `new Date(dateString)` (same timezone-corruption
// rule as the payload itself).
function formatDateDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

// Admin Asistencia Tab (spec: locked product decisions, backend contract
// sdd/asistencia/apply-progress obs #1133). Mirrors PagosTab/NotasTab's
// self-contained shape: owns its own fetches keyed on `selectedSection.id`,
// own alert/loading/empty state. Registro/Métricas toggle follows the
// Calificar/Notas pattern from NotasTab. Day roster edits are local-only
// until "Guardar día" fires a single bulk PATCH (locked decision: no
// per-checkbox network calls).
function AsistenciaTab({ selectedSection }: AsistenciaTabProps) {
  const dispatch = useAppDispatch();
  const days = useAppSelector((state) => state.attendance.days);
  const dayDetail = useAppSelector((state) => state.attendance.dayDetail);
  const metrics = useAppSelector((state) => state.attendance.metrics);
  const status = useAppSelector((state) => state.attendance.status);

  const [viewMode, setViewMode] = useState<ViewMode>("registro");
  const [message, setMessage] = useState<string>("");

  const [newDayDate, setNewDayDate] = useState<string>(getTodayLocalDateString());
  const [isAddingDay, setIsAddingDay] = useState(false);

  const [expandedDayId, setExpandedDayId] = useState<number | null>(null);
  const [isRosterLoading, setIsRosterLoading] = useState(false);
  const [localToggles, setLocalToggles] = useState<Record<number, boolean>>({});
  const [rosterSearchTerm, setRosterSearchTerm] = useState("");
  const [confirmDeleteDayId, setConfirmDeleteDayId] = useState<number | null>(null);
  const [isSavingDay, setIsSavingDay] = useState(false);
  const [isDeletingDay, setIsDeletingDay] = useState(false);

  useEffect(() => {
    if (selectedSection?.id) {
      dispatch(fetchAttendanceDays(selectedSection.id));
    }
  }, [dispatch, selectedSection?.id]);

  useEffect(() => {
    if (viewMode === "metricas" && selectedSection?.id) {
      dispatch(fetchAttendanceMetrics(selectedSection.id));
    }
  }, [dispatch, viewMode, selectedSection?.id]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Re-seeds local checkbox state from the currently loaded roster every
  // time `dayDetail` changes — both on the initial fetch (expand) and after
  // a successful "Guardar día" (the PATCH response replaces `dayDetail`),
  // which also naturally clears the dirty/hasChanges flag post-save.
  useEffect(() => {
    if (dayDetail && dayDetail.id === expandedDayId) {
      const seeded: Record<number, boolean> = {};
      dayDetail.roster.forEach((row) => {
        seeded[row.enrollmentId] = row.present;
      });
      setLocalToggles(seeded);
    }
  }, [dayDetail, expandedDayId]);

  const refetchDays = () => {
    if (selectedSection?.id) {
      dispatch(fetchAttendanceDays(selectedSection.id));
    }
  };

  const handleAddDay = async () => {
    if (!selectedSection.id || !newDayDate) return;
    if (isAddingDay) return;
    setIsAddingDay(true);
    let resultAction;
    try {
      resultAction = await dispatch(
        createAttendanceDay({ sectionId: selectedSection.id, date: newDayDate })
      );
    } finally {
      setIsAddingDay(false);
    }
    if (createAttendanceDay.fulfilled.match(resultAction)) {
      setMessage(resultAction.payload.message || "Día agregado correctamente");
      refetchDays();
    } else {
      setMessage(`Error: ${resultAction.payload ?? "no se pudo agregar el día"}`);
    }
  };

  const toggleExpand = (dayId: number) => {
    setConfirmDeleteDayId(null);
    if (expandedDayId === dayId) {
      setExpandedDayId(null);
      setRosterSearchTerm("");
      dispatch(clearAttendanceDayDetail());
      return;
    }
    setExpandedDayId(dayId);
    setRosterSearchTerm("");
    setIsRosterLoading(true);
    dispatch(fetchAttendanceDay(dayId)).finally(() => setIsRosterLoading(false));
  };

  const hasChanges = useMemo(() => {
    if (!dayDetail || dayDetail.id !== expandedDayId) return false;
    return dayDetail.roster.some((row) => (localToggles[row.enrollmentId] ?? row.present) !== row.present);
  }, [dayDetail, expandedDayId, localToggles]);

  const filteredRoster = useMemo(() => {
    if (!dayDetail) return [];
    const term = rosterSearchTerm.trim().toLowerCase();
    if (!term) return dayDetail.roster;
    return dayDetail.roster.filter((row) => row.studentName.toLowerCase().includes(term));
  }, [dayDetail, rosterSearchTerm]);

  const handleToggleStudent = (enrollmentId: number) => {
    setLocalToggles((prev) => ({ ...prev, [enrollmentId]: !prev[enrollmentId] }));
  };

  const handleSaveDay = async () => {
    if (!dayDetail) return;
    const records: AttendanceRecord[] = dayDetail.roster.map((row) => ({
      enrollmentId: row.enrollmentId,
      present: localToggles[row.enrollmentId] ?? row.present,
    }));
    if (isSavingDay) return;
    setIsSavingDay(true);
    let resultAction;
    try {
      resultAction = await dispatch(updateAttendanceDay({ dayId: dayDetail.id, records }));
    } finally {
      setIsSavingDay(false);
    }
    if (updateAttendanceDay.fulfilled.match(resultAction)) {
      setMessage(resultAction.payload.message || "Día guardado correctamente");
      refetchDays();
    } else {
      setMessage(`Error: ${resultAction.payload ?? "no se pudo guardar el día"}`);
    }
  };

  const handleDeleteDay = async (dayId: number) => {
    if (isDeletingDay) return;
    setIsDeletingDay(true);
    let resultAction;
    try {
      resultAction = await dispatch(deleteAttendanceDay(dayId));
    } finally {
      setIsDeletingDay(false);
    }
    setConfirmDeleteDayId(null);
    if (deleteAttendanceDay.fulfilled.match(resultAction)) {
      setMessage(resultAction.payload.message || "Día eliminado correctamente");
      setExpandedDayId(null);
      refetchDays();
    } else {
      setMessage(`Error: ${resultAction.payload ?? "no se pudo eliminar el día"}`);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <TabHeader title="Asistencia">
        <button
          type="button"
          onClick={() => setViewMode("registro")}
          className={`btn btn-sm flex-1 md:flex-none border-none ${
            viewMode === "registro"
              ? "bg-darkpink text-white hover:bg-black"
              : "btn-ghost bg-white text-black hover:bg-darkpink hover:text-white"
          }`}>
          Registro
        </button>
        <button
          type="button"
          onClick={() => setViewMode("metricas")}
          className={`btn btn-sm flex-1 md:flex-none border-none ${
            viewMode === "metricas"
              ? "bg-darkpink text-white hover:bg-black"
              : "btn-ghost bg-white text-black hover:bg-darkpink hover:text-white"
          }`}>
          Métricas
        </button>
      </TabHeader>

      {message && (
        <div className={`alert ${message.includes("Error") ? "alert-error" : "alert-success"} text-white`}>
          {message}
        </div>
      )}

      {viewMode === "registro" ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-500">Agregar día</span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="date"
                value={newDayDate}
                onChange={(e) => setNewDayDate(e.target.value)}
                className="input input-bordered input-sm w-full sm:w-auto bg-white text-black [color-scheme:light]"
              />
              <LoadingButton
                type="button"
                onClick={handleAddDay}
                loading={isAddingDay}
                loadingText="Agregando…"
                disabled={!newDayDate}
                className="btn btn-sm bg-darkpink text-white border-none hover:bg-black disabled:bg-darkpink disabled:text-white disabled:opacity-50">
                <IconCalendarPlus size={16} />
                Agregar día
              </LoadingButton>
            </div>
          </div>

          {status === "loading" && days.length === 0 ? (
            <div className="flex justify-center py-10">
              <span className="loading loading-spinner loading-lg text-darkpink" />
            </div>
          ) : days.length === 0 ? (
            <p className="text-center py-10 text-gray-400">Aún no hay días de asistencia registrados</p>
          ) : (
            <div className="flex flex-col gap-3">
              {days.map((day) => {
                const isExpanded = expandedDayId === day.id;
                const isConfirmingDelete = confirmDeleteDayId === day.id;
                return (
                  <div key={day.id} className="border border-grey rounded-lg overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => toggleExpand(day.id)}
                      className="w-full flex items-center justify-between gap-3 p-3 bg-white hover:bg-lightpink/40 transition-colors text-left">
                      <span className="font-medium text-black min-w-0 break-words">
                        {formatDateDisplay(day.date)}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="badge badge-outline">
                          {day.presentCount}/{day.totalCount} presentes
                        </span>
                        {isExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="flex flex-col gap-3 p-3 border-t border-grey">
                        {isRosterLoading || !dayDetail || dayDetail.id !== day.id ? (
                          <div className="flex justify-center py-6">
                            <span className="loading loading-spinner text-darkpink" />
                          </div>
                        ) : (
                          <>
                            {dayDetail.roster.length > 0 && (
                              <div className="relative">
                                <input
                                  type="text"
                                  value={rosterSearchTerm}
                                  onChange={(e) => setRosterSearchTerm(e.target.value)}
                                  placeholder="Buscar alumno..."
                                  className="input input-bordered input-sm w-full bg-white text-black"
                                />
                                <IconSearch size={16} className="absolute right-3 top-2 text-gray-400" />
                              </div>
                            )}

                            {filteredRoster.length === 0 ? (
                              <p className="text-center py-4 text-gray-400">
                                {dayDetail.roster.length === 0
                                  ? "No hay estudiantes en este día"
                                  : "No se encontraron estudiantes"}
                              </p>
                            ) : (
                              <div className="flex flex-col divide-y">
                                {filteredRoster.map((row) => (
                                  <label
                                    key={row.enrollmentId}
                                    className="flex items-center justify-between gap-3 py-2 cursor-pointer">
                                    <span className="text-black break-words">{row.studentName}</span>
                                    <input
                                      type="checkbox"
                                      checked={localToggles[row.enrollmentId] ?? row.present}
                                      onChange={() => handleToggleStudent(row.enrollmentId)}
                                      className="checkbox checkbox-sm [--chkbg:theme(colors.darkpink)] [--chkfg:white] border-grey"
                                    />
                                  </label>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-between gap-2 flex-wrap pt-2">
                              {isConfirmingDelete ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm text-gray-500">¿Eliminar este día?</span>
                                  <LoadingButton
                                    type="button"
                                    onClick={() => handleDeleteDay(day.id)}
                                    loading={isDeletingDay}
                                    loadingText="Eliminando…"
                                    className="btn btn-sm bg-error text-white border-none hover:bg-black disabled:bg-error disabled:text-white disabled:opacity-50">
                                    ¿Confirmar borrado?
                                  </LoadingButton>
                                  <button
                                    type="button"
                                    disabled={isDeletingDay}
                                    onClick={() => setConfirmDeleteDayId(null)}
                                    className="btn btn-sm btn-ghost bg-white text-black">
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteDayId(day.id)}
                                  className="btn btn-sm btn-ghost bg-white text-gray-500 hover:bg-error hover:text-white">
                                  <IconTrash size={16} /> Borrar día
                                </button>
                              )}

                              {(hasChanges || isSavingDay) && (
                                <LoadingButton
                                  type="button"
                                  onClick={handleSaveDay}
                                  loading={isSavingDay}
                                  loadingText="Guardando…"
                                  className="btn btn-sm bg-darkpink text-white border-none hover:bg-black disabled:bg-darkpink disabled:text-white disabled:opacity-70">
                                  Guardar día
                                </LoadingButton>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <MetricasTable metrics={metrics} isLoading={status === "loading"} />
      )}
    </div>
  );
}

interface MetricasTableProps {
  metrics: AttendanceMetricRow[];
  isLoading: boolean;
}

// Responsive Métricas table — real table ≥768px, stacked cards on mobile.
// Copies the `table-scroll` + `md:table*` structure from
// RowStudents.tsx/TableStudents.tsx (section-tab design standard).
function MetricasTable({ metrics, isLoading }: MetricasTableProps) {
  if (isLoading && metrics.length === 0) {
    return (
      <div className="flex justify-center py-10">
        <span className="loading loading-spinner loading-lg text-darkpink" />
      </div>
    );
  }

  if (metrics.length === 0) {
    return <p className="text-center py-10 text-gray-400">No hay métricas de asistencia disponibles</p>;
  }

  return (
    <div className="table-scroll">
      <div role="table" aria-label="Métricas de asistencia por estudiante" className="w-full md:table">
        <div role="rowgroup" className="hidden md:table-header-group">
          <div role="row" className="md:table-row text-xs uppercase tracking-wide text-gray-500 whitespace-nowrap">
            <div role="columnheader" className="md:table-cell bg-grey/40 px-3 py-2">
              Nombre
            </div>
            <div role="columnheader" className="md:table-cell bg-grey/40 px-3 py-2 w-32">
              Presentes
            </div>
            <div role="columnheader" className="md:table-cell bg-grey/40 px-3 py-2 w-32">
              Total días
            </div>
            <div role="columnheader" className="md:table-cell bg-grey/40 px-3 py-2 w-36">
              % Asistencia
            </div>
          </div>
        </div>

        <div role="rowgroup" className="flex flex-col gap-3 md:table-row-group md:gap-0">
          {metrics.map((row) => (
            <div
              key={row.enrollmentId}
              role="row"
              className="flex flex-col gap-3 border border-grey rounded-lg p-3 bg-white md:table-row md:border-0 md:rounded-none md:p-0 md:bg-transparent md:hover:bg-lightpink/40">
              <div
                role="cell"
                className="flex items-center justify-between gap-2 md:table-cell md:border-b md:border-grey md:px-3 md:py-3 md:align-middle">
                <span className="text-xs text-gray-500 md:hidden">Nombre</span>
                <span className="text-black break-words text-right md:text-left">{row.studentName}</span>
              </div>
              <div
                role="cell"
                className="flex items-center justify-between gap-2 md:table-cell md:border-b md:border-grey md:px-3 md:py-3 md:align-middle">
                <span className="text-xs text-gray-500 md:hidden">Presentes</span>
                <span className="text-black tabular-nums">{row.presentDays}</span>
              </div>
              <div
                role="cell"
                className="flex items-center justify-between gap-2 md:table-cell md:border-b md:border-grey md:px-3 md:py-3 md:align-middle">
                <span className="text-xs text-gray-500 md:hidden">Total días</span>
                <span className="text-black tabular-nums">{row.totalDays}</span>
              </div>
              <div
                role="cell"
                className="flex items-center justify-between gap-2 md:table-cell md:border-b md:border-grey md:px-3 md:py-3 md:align-middle">
                <span className="text-xs text-gray-500 md:hidden">% Asistencia</span>
                <span
                  className={`font-semibold tabular-nums ${
                    row.percentage < LOW_ATTENDANCE_THRESHOLD ? "text-yellow" : "text-darkpink"
                  }`}>
                  {row.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AsistenciaTab;
