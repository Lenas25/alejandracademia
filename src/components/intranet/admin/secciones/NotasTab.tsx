"use client";

import { useEffect, useMemo, useState } from "react";
import { LoadingButton } from "@/components/intranet/ui/LoadingButton";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { fetchActivity } from "@/redux/service/activityService";
import { fetchEnrollment } from "@/redux/service/enrollmentService";
import { fetchGrade } from "@/redux/service/gradeService";
import { fetchSectionReport } from "@/redux/service/reportService";
import { fetchInstitutionConfig } from "@/redux/service/institutionConfigService";
import { generateConstanciaPdf } from "@/utils/generateConstanciaPdf";
import { defaultInstitutionConfig } from "@/utils/constanciaConfig";
import { Section } from "@/types/section";
import { Activity } from "@/types/activity";
import { IconFileDownload } from "@tabler/icons-react";
import RowStudents from "../notas/RowStudents";
import { TableStudents } from "../notas/TableStudents";
import TabHeader from "./TabHeader";

interface NotasTabProps {
  selectedSection: Section;
}

type ViewMode = "input" | "view";

// Notas Tab (section-detail grading flow), used by both admin and tutor.
// Mirrors PagosTab's self-contained shape: owns its own fetches keyed on
// `selectedSection.id`, its own local UI state (selected activity +
// Calificar/Notas toggle), and delegates the actual grading table to
// `RowStudents` (same save/search/RHF logic as the retired standalone
// /intranet/admin/notas page, presentation redesigned to be more
// comfortable and fully responsive).
function NotasTab({ selectedSection }: NotasTabProps) {
  const dispatch = useAppDispatch();
  const activities = useAppSelector((state) => state.activity.activities);
  const activityStatus = useAppSelector((state) => state.activity.status);
  const enrollments = useAppSelector((state) => state.enrollment.enrollments);
  const enrollmentStatus = useAppSelector((state) => state.enrollment.status);
  const institutionConfig = useAppSelector((state) => state.institutionConfig.config);

  // Section whose activities were last requested; null until the fetch effect
  // runs, so the first render after a section switch (store still holding the
  // previous section's activities) never resolves an active activity.
  const [requestedSectionId, setRequestedSectionId] = useState<number | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("input");
  const [activitySearch, setActivitySearch] = useState("");
  const [message, setMessage] = useState<string>("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Derived selection: the user's pick if it still exists, otherwise the
  // first activity (auto-select) so the grading panel is never an empty
  // placeholder. Skipped while activities reload so a stale list from the
  // previous section is never auto-selected.
  const activeActivity = useMemo(() => {
    if (requestedSectionId !== selectedSection?.id) return null;
    const picked = activities.find((activity) => activity.id === selectedActivity?.id);
    if (picked) return picked;
    return activityStatus === "loading" ? null : (activities[0] ?? null);
  }, [activities, activityStatus, selectedActivity?.id, requestedSectionId, selectedSection?.id]);

  useEffect(() => {
    if (selectedSection?.id) {
      dispatch(fetchActivity(selectedSection.id));
      dispatch(fetchEnrollment({ courseId: selectedSection.id }));
    }
    setRequestedSectionId(selectedSection?.id ?? null);
    setSelectedActivity(null);
    setActivitySearch("");
  }, [dispatch, selectedSection?.id]);

  useEffect(() => {
    if (activeActivity?.id && viewMode === "input") {
      dispatch(fetchGrade(activeActivity.id));
    }
  }, [dispatch, activeActivity?.id, viewMode]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Constancia de Calificaciones PDF export (PLAN_FEATURES 4.4). Fetches
  // the full section grade report on demand (not kept in sync with the
  // grading state above — it's a point-in-time export), then hands it to
  // the client-side pdfmake generator. Follows PagosTab's
  // dispatch-then-unwrap-result convention rather than reading back from
  // the store, since the payload is only needed once, right here.
  //
  // Institution config (PLAN_FEATURES 4.4 polish) is now backend-driven —
  // if it hasn't loaded yet (store still null, e.g. the admin opened
  // Secciones directly without visiting the configurator page first),
  // fetch it here before generating. If that fetch fails, fall back to
  // `defaultInstitutionConfig` so a PDF still downloads instead of
  // blocking the whole export on a secondary config request.
  const handleDownloadConstancias = async () => {
    if (!selectedSection?.id || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      let config = institutionConfig;
      if (!config) {
        const configAction = await dispatch(fetchInstitutionConfig());
        config = fetchInstitutionConfig.fulfilled.match(configAction)
          ? configAction.payload.data
          : defaultInstitutionConfig;
      }

      const resultAction = await dispatch(fetchSectionReport(selectedSection.id));
      if (fetchSectionReport.fulfilled.match(resultAction)) {
        const activeStudents = resultAction.payload.data.students.filter((student) => student.active);
        if (activeStudents.length === 0) {
          setMessage("Error: No hay estudiantes para generar constancias");
          return;
        }
        await generateConstanciaPdf(resultAction.payload.data, config);
      } else {
        setMessage(`Error: ${resultAction.payload ?? "no se pudo generar la constancia"}`);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : "no se pudo generar la constancia"}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Informational only (spec: non-blocking) — lets the admin notice a
  // misconfigured section (activity percentages not adding up to 100)
  // without preventing grading.
  const percentageSum = useMemo(
    () => activities.reduce((sum, activity) => sum + (Number(activity.percentage) || 0), 0),
    [activities]
  );

  const isLoadingStudents = enrollmentStatus === "loading";
  const hasActivities = activities.length > 0;

  const filteredActivities = useMemo(() => {
    const term = activitySearch.trim().toLowerCase();
    if (!term) return activities;
    return activities.filter((activity) => activity.name.toLowerCase().includes(term));
  }, [activities, activitySearch]);

  return (
    <div className="flex flex-col gap-5">
      <TabHeader title={viewMode === "input" ? "Calificar Notas" : "Ver Notas"}>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
          {/* View-mode toggle */}
          <div className="flex gap-2 flex-1 sm:flex-none">
            <button
              type="button"
              onClick={() => setViewMode("input")}
              className={`btn btn-sm flex-1 sm:flex-none border-none ${
                viewMode === "input"
                  ? "bg-darkpink text-white hover:bg-black"
                  : "btn-ghost bg-white text-black hover:bg-darkpink hover:text-white"
              }`}>
              Calificar
            </button>
            <button
              type="button"
              onClick={() => setViewMode("view")}
              className={`btn btn-sm flex-1 sm:flex-none border-none ${
                viewMode === "view"
                  ? "bg-darkpink text-white hover:bg-black"
                  : "btn-ghost bg-white text-black hover:bg-darkpink hover:text-white"
              }`}>
              Notas
            </button>
          </div>
          {/* One-shot action, kept in the header toolbar. `disabled:` color
              overrides are required because daisyUI's `.btn:disabled` rule
              otherwise repaints the button grey with faint text (unreadable)
              while generating. */}
          <LoadingButton
            type="button"
            loading={isGeneratingPdf}
            loadingText="Generando PDF…"
            onClick={handleDownloadConstancias}
            className="btn btn-sm w-full sm:w-auto bg-darkpink text-white border-none hover:bg-black disabled:bg-darkpink disabled:text-white disabled:opacity-70">
            <IconFileDownload size={16} />
            Descargar constancias (PDF)
          </LoadingButton>
        </div>
      </TabHeader>

      {message && (
        <div className={`alert ${message.includes("Error") ? "alert-error" : "alert-success"} text-white`}>
          {message}
        </div>
      )}

      <div
        className={
          viewMode === "input" && hasActivities
            ? "grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)] lg:items-start"
            : "flex flex-col gap-5"
        }>
        {viewMode === "input" && (
          <aside
            aria-label="Actividades"
            className="flex flex-col gap-2 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:overscroll-contain lg:rounded-lg lg:border lg:border-grey lg:bg-white lg:p-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-sm font-medium text-gray-500">Actividades</span>
              {hasActivities && (
                <span
                  className={`text-xs font-medium ${
                    percentageSum > 100 ? "text-yellow" : "text-gray-400"
                  }`}>
                  Suma de %: {percentageSum}%
                </span>
              )}
            </div>

            {activityStatus === "loading" && !hasActivities ? (
              <div className="flex justify-center py-4">
                <span className="loading loading-spinner text-darkpink" />
              </div>
            ) : !hasActivities ? (
              <p className="text-sm text-gray-400">Esta sección no tiene actividades configuradas</p>
            ) : (
              <>
                {/* Below lg: native select — no wrapping/clipping, no nested scroll, fits 360px. */}
                <select
                  aria-label="Seleccionar actividad"
                  value={activeActivity?.id ?? ""}
                  onChange={(e) => {
                    const next = activities.find((activity) => String(activity.id) === e.target.value);
                    if (next) setSelectedActivity(next);
                  }}
                  className="select select-bordered w-full max-w-full bg-white text-black lg:hidden">
                  {activities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.name} · {activity.percentage}%
                    </option>
                  ))}
                </select>

                {/* lg+: searchable master list. */}
                <div className="hidden lg:flex flex-col gap-2 min-h-0">
                  <input
                    type="text"
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    placeholder="Buscar actividad..."
                    aria-label="Buscar actividad"
                    className="input input-bordered input-sm w-full bg-white text-black"
                  />
                  {filteredActivities.length === 0 ? (
                    <p className="text-sm text-gray-400 py-2">No se encontraron actividades</p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {filteredActivities.map((activity) => {
                        const isActive = activeActivity?.id === activity.id;
                        return (
                          <li key={activity.id}>
                            <button
                              type="button"
                              title={activity.name}
                              aria-current={isActive ? "true" : undefined}
                              onClick={() => setSelectedActivity(activity)}
                              className={`flex w-full min-h-10 items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-darkpink ${
                                isActive
                                  ? "bg-darkpink text-white border-darkpink font-medium"
                                  : "bg-white text-black border-grey hover:bg-lightpink"
                              }`}>
                              <span className="line-clamp-2 break-words">{activity.name}</span>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-xs tabular-nums ${
                                  isActive ? "bg-white/20 text-white" : "bg-grey/60 text-gray-600"
                                }`}>
                                {activity.percentage}%
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </>
            )}
          </aside>
        )}

        <div className="min-w-0">
          {isLoadingStudents ? (
            <div className="flex justify-center py-10">
              <span className="loading loading-spinner loading-lg text-darkpink" />
            </div>
          ) : enrollments.length === 0 ? (
            <p className="text-center py-10 text-gray-400">No hay estudiantes matriculados en esta sección</p>
          ) : viewMode === "view" ? (
            <TableStudents />
          ) : activeActivity ? (
            <RowStudents selectedSection={selectedSection} selectedActivity={activeActivity} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default NotasTab;
