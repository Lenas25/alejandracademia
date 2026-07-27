"use client";

import { useEffect, useMemo, useState } from "react";
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

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("input");
  const [message, setMessage] = useState<string>("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (selectedSection?.id) {
      dispatch(fetchActivity(selectedSection.id));
      dispatch(fetchEnrollment({ courseId: selectedSection.id }));
    }
    setSelectedActivity(null);
  }, [dispatch, selectedSection?.id]);

  useEffect(() => {
    if (selectedActivity?.id && viewMode === "input") {
      dispatch(fetchGrade(selectedActivity.id));
    }
  }, [dispatch, selectedActivity?.id, viewMode]);

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
    if (!selectedSection?.id) return;
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
          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleDownloadConstancias}
            className="btn btn-sm w-full sm:w-auto bg-darkpink text-white border-none hover:bg-black disabled:bg-darkpink disabled:text-white disabled:opacity-70">
            {isGeneratingPdf ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <IconFileDownload size={16} />
            )}
            Descargar constancias (PDF)
          </button>
        </div>
      </TabHeader>

      {message && (
        <div className={`alert ${message.includes("Error") ? "alert-error" : "alert-success"} text-white`}>
          {message}
        </div>
      )}

      {viewMode === "input" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-500">Actividades</span>
            {activities.length > 0 && (
              <span
                className={`text-xs font-medium ${
                  percentageSum > 100 ? "text-yellow" : "text-gray-400"
                }`}>
                Suma de %: {percentageSum}%
              </span>
            )}
          </div>

          {activityStatus === "loading" && activities.length === 0 ? (
            <div className="flex justify-center py-4">
              <span className="loading loading-spinner text-darkpink" />
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-gray-400">Esta sección no tiene actividades configuradas</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activities.map((activity) => (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => setSelectedActivity(activity)}
                  className={`btn btn-sm rounded-full border-none normal-case ${
                    selectedActivity?.id === activity.id
                      ? "bg-darkpink text-white"
                      : "bg-white text-black border border-grey hover:bg-darkpink hover:text-white"
                  }`}>
                  {activity.name} · {activity.percentage}%
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoadingStudents ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-lg text-darkpink" />
        </div>
      ) : enrollments.length === 0 ? (
        <p className="text-center py-10 text-gray-400">No hay estudiantes matriculados en esta sección</p>
      ) : viewMode === "view" ? (
        <TableStudents />
      ) : !selectedActivity ? (
        <div className="flex justify-center items-center py-10">
          <span className="badge badge-outline h-auto text-base py-2 px-4 text-center">
            Seleccione una actividad para calificar
          </span>
        </div>
      ) : (
        <RowStudents selectedSection={selectedSection} selectedActivity={selectedActivity} />
      )}
    </div>
  );
}

export default NotasTab;
