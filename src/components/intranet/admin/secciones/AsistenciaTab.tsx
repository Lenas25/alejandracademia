"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoadingButton } from "@/components/intranet/ui/LoadingButton";
import { useToast } from "@/components/intranet/ui/Toast";
import { useUnsavedChanges } from "@/components/intranet/ui/UnsavedChanges";
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
import { AttendanceDaySummary, AttendanceMetricRow, AttendanceRecord } from "@/types/attendance";
import {
  IconCalendarPlus,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { SegmentedToggle } from "@/components/intranet/ui/SegmentedToggle";
import TabHeader from "./TabHeader";

interface AsistenciaTabProps {
  selectedSection: Section;
}

type ViewMode = "registro" | "metricas";

// Below this attendance percentage the Métricas table flags the row in
// yellow — informational only (spec: "informational only, do not block").
const LOW_ATTENDANCE_THRESHOLD = 70;

// Debounce for the day-list search box.
const DAY_SEARCH_DEBOUNCE_MS = 200;

const VIEW_OPTIONS = [
  { value: "registro", label: "Registro" },
  { value: "metricas", label: "Métricas" },
];

// How long the "just added" ring stays on a freshly created day.
const HIGHLIGHT_MS = 2200;

const WEEKDAYS_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MONTHS_LONG = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

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

// Parses a YYYY-MM-DD string into numeric parts without ever building a
// local-timezone `Date` (same timezone-corruption rule as the payload).
function parseDateParts(dateStr: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

// "2026-08-12" -> "mié 12 ago 2026". The weekday is derived with
// Date.UTC + getUTCDay so it never shifts with the viewer's timezone.
function formatDayLabel(dateStr: string): string {
  const parts = parseDateParts(dateStr);
  if (!parts) return dateStr;
  const weekday = WEEKDAYS_SHORT[new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay()];
  return `${weekday} ${parts.day} ${MONTHS_SHORT[parts.month - 1]} ${parts.year}`;
}

// "2026-08-12" -> "Agosto 2026" (month group header).
function formatMonthLabel(dateStr: string): string {
  const parts = parseDateParts(dateStr);
  if (!parts) return dateStr;
  return `${MONTHS_LONG[parts.month - 1]} ${parts.year}`;
}

// Lowercases and strips accents so "miércoles"/"mie" and "MAR" all compare.
function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Searchable text of a day: short label ("mié 12 ago 2026"), ISO date and the
// long month name, so "12", "ago", "agosto", "2026" and "2026-08-12" all hit.
function buildDaySearchText(day: AttendanceDaySummary): string {
  const parts = parseDateParts(day.date);
  const longMonth = parts ? MONTHS_LONG[parts.month - 1] : "";
  return normalizeText(`${formatDayLabel(day.date)} ${day.date} ${longMonth}`);
}

// Every whitespace-separated token of the (already normalized) term must match.
function dayMatchesSearch(day: AttendanceDaySummary, term: string): boolean {
  if (!term) return true;
  const haystack = buildDaySearchText(day);
  return term.split(/\s+/).every((token) => haystack.includes(token));
}

interface DayFilters {
  term: string;
  month: string;
  onlyAbsences: boolean;
}

function filterDays(days: AttendanceDaySummary[], filters: DayFilters): AttendanceDaySummary[] {
  const { term, month, onlyAbsences } = filters;
  if (!term && !month && !onlyAbsences) return days;
  return days.filter(
    (day) =>
      (!month || day.date.slice(0, 7) === month) &&
      (!onlyAbsences || day.presentCount < day.totalCount) &&
      dayMatchesSearch(day, term),
  );
}

function groupByMonth(sortedDays: AttendanceDaySummary[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const day of sortedDays) {
    const key = day.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.days.push(day);
    } else {
      groups.push({ key, label: formatMonthLabel(day.date), days: [day] });
    }
  }
  return groups;
}

interface MonthGroup {
  key: string;
  label: string;
  days: AttendanceDaySummary[];
}

// Admin Asistencia Tab (spec: locked product decisions, backend contract
// sdd/asistencia/apply-progress obs #1133). Mirrors PagosTab/NotasTab's
// self-contained shape: owns its own fetches keyed on `selectedSection.id`,
// own loading/empty state, feedback via the shared toast. Registro/Métricas
// toggle follows the Calificar/Notas pattern from NotasTab. Day roster edits
// are local-only until "Guardar día" fires a single bulk PATCH (locked
// decision: no per-checkbox network calls).
function AsistenciaTab({ selectedSection }: AsistenciaTabProps) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const days = useAppSelector((state) => state.attendance.days);
  const dayDetail = useAppSelector((state) => state.attendance.dayDetail);
  const metrics = useAppSelector((state) => state.attendance.metrics);
  const status = useAppSelector((state) => state.attendance.status);

  const [viewMode, setViewMode] = useState<ViewMode>("registro");

  // Day-list filters (Registro view). `searchInput` is the live text,
  // `searchTerm` its debounced, normalized twin used for matching.
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [onlyAbsences, setOnlyAbsences] = useState(false);

  const [newDayDate, setNewDayDate] = useState<string>(getTodayLocalDateString());
  const [isAddingDay, setIsAddingDay] = useState(false);

  const [expandedDayId, setExpandedDayId] = useState<number | null>(null);
  const [isRosterLoading, setIsRosterLoading] = useState(false);
  const [localToggles, setLocalToggles] = useState<Record<number, boolean>>({});
  const [rosterSearchTerm, setRosterSearchTerm] = useState("");
  const [confirmDeleteDayId, setConfirmDeleteDayId] = useState<number | null>(null);
  const [isSavingDay, setIsSavingDay] = useState(false);
  const [isDeletingDay, setIsDeletingDay] = useState(false);

  // Navigation away from a day with unsaved edits waits for an inline
  // confirmation. `null` = nothing pending; a number = open that day next;
  // "close" = collapse the current day.
  const [pendingNav, setPendingNav] = useState<number | "close" | null>(null);
  // Day to scroll to / ring once it is expanded (set after "Agregar día").
  const [scrollToId, setScrollToId] = useState<number | null>(null);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // In-flight roster fetch. Opening another day (or closing / switching
  // section) aborts it so a late response can never overwrite `dayDetail`.
  const rosterRequest = useRef<{ abort: () => void } | null>(null);
  // In-flight day-list fetch; aborted on section switch / unmount / refetch so
  // a slow response for a previous section never lands in `days`.
  const daysRequest = useRef<{ abort: () => void } | null>(null);
  // Latest values for async continuations that outlive the render that
  // created them (handleAddDay awaits network calls before navigating).
  const sectionIdRef = useRef<number | undefined>(selectedSection?.id);
  const hasChangesRef = useRef(false);
  const expandedDayIdRef = useRef<number | null>(null);

  const refreshDays = useCallback(
    (sectionId: number) => {
      daysRequest.current?.abort();
      const request = dispatch(fetchAttendanceDays(sectionId));
      daysRequest.current = request;
      return request;
    },
    [dispatch],
  );

  useEffect(() => {
    sectionIdRef.current = selectedSection?.id;
    if (selectedSection?.id) {
      refreshDays(selectedSection.id);
    }
    // Switching section: drop any open day so no stale roster/edit leaks over.
    rosterRequest.current?.abort();
    rosterRequest.current = null;
    setIsRosterLoading(false);
    setExpandedDayId(null);
    setPendingNav(null);
    setConfirmDeleteDayId(null);
    setRosterSearchTerm("");
    setSearchInput("");
    setSearchTerm("");
    setMonthFilter("");
    setOnlyAbsences(false);
    dispatch(clearAttendanceDayDetail());
    return () => {
      daysRequest.current?.abort();
      daysRequest.current = null;
      rosterRequest.current?.abort();
      rosterRequest.current = null;
    };
  }, [dispatch, refreshDays, selectedSection?.id]);

  useEffect(() => {
    if (viewMode === "metricas" && selectedSection?.id) {
      dispatch(fetchAttendanceMetrics(selectedSection.id));
    }
  }, [dispatch, viewMode, selectedSection?.id]);

  useEffect(
    () => () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
    },
    [],
  );

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

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(normalizeText(searchInput.trim())), DAY_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Newest first. The backend order is left untouched; sorting happens here
  // on the YYYY-MM-DD strings.
  const sortedDays = useMemo(
    () =>
      [...days].sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return b.id - a.id;
      }),
    [days],
  );

  // Months present in the data, newest first (sortedDays is already ordered).
  const monthOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { key: string; label: string }[] = [];
    for (const day of sortedDays) {
      const key = day.date.slice(0, 7);
      if (seen.has(key)) continue;
      seen.add(key);
      options.push({ key, label: formatMonthLabel(day.date) });
    }
    return options;
  }, [sortedDays]);

  // A stored month that vanished from the data (deleted day / new section)
  // must not silently hide everything.
  const effectiveMonth = monthOptions.some((o) => o.key === monthFilter) ? monthFilter : "";
  const hasActiveFilters = searchInput.trim() !== "" || effectiveMonth !== "" || onlyAbsences;

  // Filters apply BEFORE month grouping, so headers only exist for months
  // with visible days. The open day is always kept visible: hiding it would
  // strand its unsaved edits behind a filter.
  const visibleDays = useMemo(() => {
    const filtered = new Set(
      filterDays(sortedDays, { term: searchTerm, month: effectiveMonth, onlyAbsences }).map((d) => d.id),
    );
    return sortedDays.filter((d) => filtered.has(d.id) || d.id === expandedDayId);
  }, [sortedDays, searchTerm, effectiveMonth, onlyAbsences, expandedDayId]);

  const monthGroups = useMemo(() => groupByMonth(visibleDays), [visibleDays]);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setSearchTerm("");
    setMonthFilter("");
    setOnlyAbsences(false);
  }, []);

  const changedCount = useMemo(() => {
    if (!dayDetail || dayDetail.id !== expandedDayId) return 0;
    return dayDetail.roster.filter((row) => (localToggles[row.enrollmentId] ?? row.present) !== row.present).length;
  }, [dayDetail, expandedDayId, localToggles]);
  const hasChanges = changedCount > 0;
  useUnsavedChanges("asistencia", hasChanges, "Asistencia");

  useEffect(() => {
    hasChangesRef.current = hasChanges;
    expandedDayIdRef.current = expandedDayId;
  }, [hasChanges, expandedDayId]);

  // A pending discard prompt is meaningless once the edits are reverted.
  useEffect(() => {
    if (!hasChanges) setPendingNav(null);
  }, [hasChanges]);

  const presentNow = useMemo(() => {
    if (!dayDetail || dayDetail.id !== expandedDayId) return 0;
    return dayDetail.roster.filter((row) => localToggles[row.enrollmentId] ?? row.present).length;
  }, [dayDetail, expandedDayId, localToggles]);

  const filteredRoster = useMemo(() => {
    if (!dayDetail) return [];
    const term = rosterSearchTerm.trim().toLowerCase();
    if (!term) return dayDetail.roster;
    return dayDetail.roster.filter((row) => row.studentName.toLowerCase().includes(term));
  }, [dayDetail, rosterSearchTerm]);

  const openDay = useCallback(
    (dayId: number) => {
      setConfirmDeleteDayId(null);
      setPendingNav(null);
      setExpandedDayId(dayId);
      setRosterSearchTerm("");
      setIsRosterLoading(true);
      rosterRequest.current?.abort();
      const request = dispatch(fetchAttendanceDay(dayId));
      rosterRequest.current = request;
      request.then((action) => {
        // Superseded (another day opened / closed): ignore, no toast.
        if (rosterRequest.current !== request) return;
        rosterRequest.current = null;
        setIsRosterLoading(false);
        if (fetchAttendanceDay.rejected.match(action)) {
          toast.error(action.payload ?? "No se pudo cargar el día de asistencia");
          setExpandedDayId(null);
          dispatch(clearAttendanceDayDetail());
        }
      });
    },
    [dispatch, toast],
  );

  const closeDay = useCallback(() => {
    rosterRequest.current?.abort();
    rosterRequest.current = null;
    setConfirmDeleteDayId(null);
    setPendingNav(null);
    setExpandedDayId(null);
    setRosterSearchTerm("");
    setIsRosterLoading(false);
    dispatch(clearAttendanceDayDetail());
  }, [dispatch]);

  // Single entry point for every expand/collapse request so unsaved edits
  // are never discarded silently.
  const requestNav = useCallback(
    (target: number | "close") => {
      // Read through refs so async callers (handleAddDay) see the CURRENT
      // dirty state, not the one captured when their render happened.
      if (hasChangesRef.current && expandedDayIdRef.current !== null) {
        setPendingNav(target);
        return;
      }
      if (target === "close") closeDay();
      else openDay(target);
    },
    [closeDay, openDay],
  );

  const toggleExpand = (dayId: number) => {
    requestNav(expandedDayId === dayId ? "close" : dayId);
  };

  const confirmDiscard = () => {
    const target = pendingNav;
    if (target === null) return;
    if (target === "close") closeDay();
    else openDay(target);
  };

  // Scroll + ring a freshly added day once it is expanded in the DOM.
  useEffect(() => {
    if (scrollToId === null || expandedDayId !== scrollToId) return;
    const el = document.getElementById(`asistencia-day-${scrollToId}`);
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    setHighlightId(scrollToId);
    setScrollToId(null);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
  }, [scrollToId, expandedDayId, days]);

  const handleAddDay = async () => {
    if (!selectedSection.id || !newDayDate) return;
    if (isAddingDay) return;
    const sectionId = selectedSection.id;
    setIsAddingDay(true);
    try {
      const resultAction = await dispatch(createAttendanceDay({ sectionId, date: newDayDate }));
      if (createAttendanceDay.fulfilled.match(resultAction)) {
        toast.success(resultAction.payload.message || "Día agregado correctamente");
        await refreshDays(sectionId);
        // The user may have switched section while the calls were in flight.
        if (sectionIdRef.current !== sectionId) return;
        const newId = resultAction.payload.data?.id;
        if (typeof newId === "number") {
          // The new day may be hidden by an active filter (its counts are
          // not known yet), so reset them before expanding / scrolling to it.
          clearFilters();
          setScrollToId(newId);
          requestNav(newId);
        }
      } else {
        // 409 (duplicate date) arrives here already mapped to a friendly
        // Spanish message by the thunk.
        toast.error(resultAction.payload ?? "No se pudo agregar el día");
      }
    } finally {
      setIsAddingDay(false);
    }
  };

  const handleToggleStudent = (enrollmentId: number) => {
    setLocalToggles((prev) => ({ ...prev, [enrollmentId]: !prev[enrollmentId] }));
  };

  // Bulk mark — applies to the currently FILTERED rows only.
  const markFiltered = (present: boolean) => {
    setLocalToggles((prev) => {
      const next = { ...prev };
      filteredRoster.forEach((row) => {
        next[row.enrollmentId] = present;
      });
      return next;
    });
  };

  const handleSaveDay = async () => {
    if (!dayDetail || isSavingDay) return;
    const records: AttendanceRecord[] = dayDetail.roster.map((row) => ({
      enrollmentId: row.enrollmentId,
      present: localToggles[row.enrollmentId] ?? row.present,
    }));
    setIsSavingDay(true);
    try {
      const resultAction = await dispatch(updateAttendanceDay({ dayId: dayDetail.id, records }));
      if (updateAttendanceDay.fulfilled.match(resultAction)) {
        toast.success(resultAction.payload.message || "Día guardado correctamente");
        if (selectedSection?.id) refreshDays(selectedSection.id);
      } else {
        toast.error(resultAction.payload ?? "No se pudo guardar el día");
      }
    } finally {
      setIsSavingDay(false);
    }
  };

  const handleDeleteDay = async (dayId: number) => {
    if (isDeletingDay) return;
    setIsDeletingDay(true);
    try {
      const resultAction = await dispatch(deleteAttendanceDay(dayId));
      setConfirmDeleteDayId(null);
      if (deleteAttendanceDay.fulfilled.match(resultAction)) {
        toast.success(resultAction.payload.message || "Día eliminado correctamente");
        setExpandedDayId(null);
        setPendingNav(null);
        if (selectedSection?.id) refreshDays(selectedSection.id);
      } else {
        toast.error(resultAction.payload ?? "No se pudo eliminar el día");
      }
    } finally {
      setIsDeletingDay(false);
    }
  };

  const filterActive = rosterSearchTerm.trim() !== "";

  return (
    <div className="flex flex-col gap-5">
      <TabHeader title="Asistencia">
        <SegmentedToggle
          variant="radio"
          ariaLabel="Vista de asistencia"
          options={VIEW_OPTIONS}
          value={viewMode}
          onChange={(v) => setViewMode(v as ViewMode)}
        />
      </TabHeader>

      {viewMode === "registro" ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="asistencia-new-day" className="text-sm font-medium text-gray-500">
              Agregar día
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                id="asistencia-new-day"
                type="date"
                value={newDayDate}
                onChange={(e) => setNewDayDate(e.target.value)}
                className="input input-bordered h-11 w-full sm:w-auto bg-white text-black [color-scheme:light]"
              />
              <LoadingButton
                type="button"
                onClick={handleAddDay}
                loading={isAddingDay}
                loadingText="Agregando…"
                disabled={!newDayDate}
                className="btn h-11 min-h-11 w-full sm:w-auto bg-darkpink text-white border-none hover:bg-black disabled:bg-darkpink disabled:text-white disabled:opacity-50">
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
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <div className="relative md:flex-1">
                    <input
                      type="search"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Buscar día (ej. lun, agosto, 2026-08-12)..."
                      aria-label="Buscar día"
                      className="input input-bordered h-11 w-full bg-white pr-10 text-black [&::-webkit-search-cancel-button]:hidden"
                    />
                    <IconSearch
                      size={16}
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                  <select
                    aria-label="Filtrar por mes"
                    value={effectiveMonth}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="select select-bordered h-11 w-full bg-white text-black md:w-52">
                    <option value="">Todos los meses</option>
                    {monthOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    aria-pressed={onlyAbsences}
                    onClick={() => setOnlyAbsences((v) => !v)}
                    className={`btn h-11 min-h-11 w-full whitespace-nowrap md:w-auto ${
                      onlyAbsences
                        ? "border-none bg-darkpink text-white hover:bg-black"
                        : "btn-ghost border border-grey bg-white text-black hover:bg-lightpink"
                    }`}>
                    Solo con ausencias
                  </button>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="btn btn-ghost h-11 min-h-11 w-full whitespace-nowrap bg-white text-gray-600 md:w-auto">
                      <IconX size={16} aria-hidden="true" />
                      Limpiar filtros
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500" aria-live="polite">
                  Mostrando {visibleDays.length} de {days.length} {days.length === 1 ? "día" : "días"}
                </p>
              </div>

              {monthGroups.length === 0 && (
                <p className="text-center py-10 text-gray-400">No hay días que coincidan con los filtros</p>
              )}

              {monthGroups.map((group) => (
                <section key={group.key} aria-label={group.label} className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{group.label}</h3>
                  {group.days.map((day) => {
                    const isExpanded = expandedDayId === day.id;
                    const isConfirmingDelete = confirmDeleteDayId === day.id;
                    const isHighlighted = highlightId === day.id;
                    const panelId = `asistencia-panel-${day.id}`;
                    return (
                      <div
                        key={day.id}
                        id={`asistencia-day-${day.id}`}
                        className={`border rounded-lg overflow-x-clip bg-white transition-shadow duration-700 motion-reduce:transition-none ${
                          isHighlighted ? "border-darkpink ring-2 ring-darkpink/60" : "border-grey ring-0 ring-transparent"
                        }`}>
                        <button
                          type="button"
                          onClick={() => toggleExpand(day.id)}
                          aria-expanded={isExpanded}
                          aria-controls={isExpanded ? panelId : undefined}
                          className="w-full flex items-center justify-between gap-3 p-3 min-h-12 bg-white hover:bg-lightpink/40 transition-colors text-left rounded-lg">
                          <span className="font-medium text-black min-w-0 break-words">
                            {formatDayLabel(day.date)}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="badge badge-outline">
                              {day.presentCount}/{day.totalCount} presentes
                            </span>
                            {isExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div id={panelId} className="flex flex-col gap-3 p-3 pb-0 border-t border-grey">
                            {isRosterLoading || !dayDetail || dayDetail.id !== day.id ? (
                              <div className="flex justify-center py-6">
                                <span className="loading loading-spinner text-darkpink" />
                              </div>
                            ) : (
                              <>
                                {dayDetail.roster.length > 0 && (
                                  <>
                                    <div className="relative">
                                      <label htmlFor={`asistencia-search-${day.id}`} className="sr-only">
                                        Buscar alumno
                                      </label>
                                      <input
                                        id={`asistencia-search-${day.id}`}
                                        type="text"
                                        value={rosterSearchTerm}
                                        onChange={(e) => setRosterSearchTerm(e.target.value)}
                                        placeholder="Buscar alumno..."
                                        className="input input-bordered h-11 w-full bg-white pr-10 text-black"
                                      />
                                      <IconSearch
                                        size={16}
                                        aria-hidden="true"
                                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                      />
                                    </div>

                                    {/* Sticky toolbar: top-16 on mobile clears the fixed
                                        hamburger (admin layout pt-16), top-0 from md up. */}
                                    <div className="sticky top-16 md:top-0 z-10 -mx-3 flex flex-col gap-2 border-b border-grey bg-white/95 px-3 py-2 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-live="polite">
                                        <span className="text-sm font-semibold text-black tabular-nums">
                                          {presentNow}/{dayDetail.roster.length} presentes
                                        </span>
                                        {hasChanges && (
                                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800">
                                            <span aria-hidden="true" className="size-2 rounded-full bg-amber-500" />
                                            Cambios sin guardar
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => markFiltered(true)}
                                          disabled={filteredRoster.length === 0 || isSavingDay}
                                          title={filterActive ? "Aplica solo a los alumnos filtrados" : undefined}
                                          className="btn h-10 min-h-10 flex-1 sm:flex-none px-2 text-xs sm:px-3 sm:text-sm btn-ghost bg-white text-black border border-grey hover:bg-emerald-600 hover:text-white">
                                          Marcar todos presentes
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => markFiltered(false)}
                                          disabled={filteredRoster.length === 0 || isSavingDay}
                                          title={filterActive ? "Aplica solo a los alumnos filtrados" : undefined}
                                          className="btn h-10 min-h-10 flex-1 sm:flex-none px-2 text-xs sm:px-3 sm:text-sm btn-ghost bg-white text-black border border-grey hover:bg-error hover:text-white">
                                          Marcar todos ausentes
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                )}

                                {filteredRoster.length === 0 ? (
                                  <p className="text-center py-4 text-gray-400">
                                    {dayDetail.roster.length === 0
                                      ? "No hay estudiantes en este día"
                                      : "No se encontraron estudiantes"}
                                  </p>
                                ) : (
                                  <div className="flex flex-col divide-y">
                                    {filteredRoster.map((row) => {
                                      const present = localToggles[row.enrollmentId] ?? row.present;
                                      return (
                                        <label
                                          key={row.enrollmentId}
                                          className="flex min-h-11 cursor-pointer items-center gap-3 px-1 py-2 hover:bg-lightpink/40">
                                          <span className="min-w-0 flex-1 break-words text-black">
                                            {row.studentName}
                                          </span>
                                          <span
                                            className={`w-16 shrink-0 text-right text-sm font-medium ${
                                              present ? "text-emerald-700" : "text-red-700"
                                            }`}>
                                            {present ? "Presente" : "Ausente"}
                                          </span>
                                          <input
                                            type="checkbox"
                                            checked={present}
                                            onChange={() => handleToggleStudent(row.enrollmentId)}
                                            disabled={isSavingDay}
                                            aria-label={`${row.studentName}: ${present ? "presente" : "ausente"}`}
                                            className="checkbox checkbox-md shrink-0 [--chkbg:theme(colors.darkpink)] [--chkfg:white] border-grey"
                                          />
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}

                                <div className="flex items-center justify-between gap-2 flex-wrap pt-1 pb-3">
                                  {isConfirmingDelete ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm text-gray-500">¿Eliminar este día?</span>
                                      <LoadingButton
                                        type="button"
                                        onClick={() => handleDeleteDay(day.id)}
                                        loading={isDeletingDay}
                                        loadingText="Eliminando…"
                                        className="btn h-10 min-h-10 bg-error text-white border-none hover:bg-black disabled:bg-error disabled:text-white disabled:opacity-50">
                                        ¿Confirmar borrado?
                                      </LoadingButton>
                                      <button
                                        type="button"
                                        disabled={isDeletingDay}
                                        onClick={() => setConfirmDeleteDayId(null)}
                                        className="btn h-10 min-h-10 btn-ghost bg-white text-black">
                                        Cancelar
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteDayId(day.id)}
                                      className="btn h-10 min-h-10 btn-ghost bg-white text-gray-500 hover:bg-error hover:text-white">
                                      <IconTrash size={16} /> Borrar día
                                    </button>
                                  )}
                                </div>

                                {(hasChanges || isSavingDay) && (
                                  <div className="sticky bottom-0 z-10 -mx-3 flex flex-col gap-2 border-t border-grey bg-white/95 px-3 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur">
                                    {pendingNav !== null && hasChanges && (
                                      <div
                                        role="alert"
                                        className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                                        <span className="text-sm font-medium text-amber-900">
                                          Tienes cambios sin guardar. ¿Descartar?
                                        </span>
                                        <div className="flex gap-2">
                                          <button
                                            type="button"
                                            onClick={confirmDiscard}
                                            disabled={isSavingDay}
                                            className="btn h-10 min-h-10 flex-1 sm:flex-none bg-error text-white border-none hover:bg-black">
                                            Descartar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setPendingNav(null)}
                                            className="btn h-10 min-h-10 flex-1 sm:flex-none btn-ghost bg-white text-black">
                                            Seguir editando
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="min-w-0 text-sm text-gray-600" aria-live="polite">
                                        {changedCount} {changedCount === 1 ? "cambio" : "cambios"} sin guardar
                                      </span>
                                      <LoadingButton
                                        type="button"
                                        onClick={handleSaveDay}
                                        loading={isSavingDay}
                                        loadingText="Guardando…"
                                        className="btn h-11 min-h-11 shrink-0 bg-darkpink text-white border-none hover:bg-black disabled:bg-darkpink disabled:text-white disabled:opacity-70">
                                        Guardar día
                                      </LoadingButton>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </section>
              ))}
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

// Responsive Métricas table — real table >=768px, compact cards on mobile
// (name on its own line, the three figures side by side below it). Same
// `md:table*` display-utility structure as RowStudents/TableStudents.
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

  const cellClass = "flex flex-col gap-0.5 md:table-cell md:border-b md:border-grey md:px-3 md:py-3 md:align-middle";

  return (
    <div className="table-scroll table-scroll-sticky">
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
              className="grid grid-cols-3 gap-x-2 gap-y-2 border border-grey rounded-lg p-3 bg-white md:table-row md:border-0 md:rounded-none md:p-0 md:bg-transparent md:hover:bg-lightpink/40">
              <div role="cell" className="col-span-3 md:col-span-1 md:table-cell md:border-b md:border-grey md:px-3 md:py-3 md:align-middle">
                <span className="block min-w-0 break-words font-medium text-black md:font-normal">
                  {row.studentName}
                </span>
              </div>
              <div role="cell" className={cellClass}>
                <span className="text-xs text-gray-500 md:hidden">Presentes</span>
                <span className="text-black tabular-nums">{row.presentDays}</span>
              </div>
              <div role="cell" className={cellClass}>
                <span className="text-xs text-gray-500 md:hidden">Total días</span>
                <span className="text-black tabular-nums">{row.totalDays}</span>
              </div>
              <div role="cell" className={cellClass}>
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
