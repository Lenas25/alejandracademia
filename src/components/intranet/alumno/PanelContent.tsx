"use client";

import { useAppSelector } from "@/redux/stores";
import { useEffect, useState } from "react";

import { IconCircleCheckFilled } from "@tabler/icons-react";
import { AsistenciaCard } from "./AsistenciaCard";
import { Bienvenida } from "./Bienvenida";
import { CourseSelector } from "./CourseSelector";
import { CuotasCard } from "./CuotasCard";
import { CursoCard } from "./CursoCard";
import { NotasCard } from "./NotasCard";
import { SummaryTiles } from "./SummaryTiles";
import { SegmentedToggle } from "../ui/SegmentedToggle";

const DETAIL_TABS = [
  { value: "notas", label: "Notas" },
  { value: "asistencia", label: "Asistencia" },
  { value: "cuotas", label: "Cuotas" },
];

export function PanelContent() {
  const userLogin = useAppSelector((state) => state.user.userLogin);
  const enrollmentsUser = useAppSelector((state) => state.enrollment.enrollmentsUser);
  // A finished enrollment has `active === false` (set by the admin's
  // "Finalizar sección" action). It drives an explicit banner so the student
  // clearly sees the course has ended (the tile chip alone is too subtle).
  const enrollmentView = useAppSelector((state) => state.enrollment.enrollmentView);
  const isCourseFinished = enrollmentView?.active === false;
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("notas");
  // Below lg only the active detail panel is visible; at lg+ every panel is.
  const panelClass = (tab: string) => (activeTab === tab ? "" : "hidden lg:block");

  // Cuando userLogin no está disponible aún (Redux no hidratado) mantenemos skeleton.
  // Cuando userLogin está presente y enrollmentsUser ya fue cargado (puede ser [])
  // consideramos que el panel está listo para mostrarse.
  useEffect(() => {
    if (userLogin !== null && userLogin !== undefined) {
      // Damos un tick para que el thunk dispatch de CourseSelector arranque,
      // pero no esperamos su resultado — CourseSelector ya tiene su propio
      // estado interno. El skeleton aquí protege solo la hidratación
      // inicial de Redux.
      setIsLoading(false);
    }
  }, [userLogin, enrollmentsUser]);

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        {/* Bienvenida skeleton */}
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded-lg w-56" />
          <div className="h-4 bg-gray-100 rounded w-64 max-w-full" />
        </div>

        {/* Tiles skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 rounded-2xl h-24" />
          ))}
        </div>

        {/* CursoCard skeleton */}
        <div className="bg-gray-200 rounded-2xl h-36" />

        {/* Detail cards skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-200 rounded-2xl h-64" />
          <div className="bg-gray-200 rounded-2xl h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Bienvenida */}
      <Bienvenida />

      {/* Selector multi-curso — oculto si el alumno tiene solo 1 matrícula */}
      <CourseSelector />

      {/* Aviso claro de curso finalizado — el veredicto del anillo solo no
          alcanza como señal. */}
      {isCourseFinished && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-darkpink/30 bg-lightpink px-4 py-3 text-black">
          <IconCircleCheckFilled className="text-darkpink shrink-0" size={28} />
          <div>
            <p className="font-semibold">Este curso ya finalizó</p>
            <p className="text-sm text-gray-600">
              Tu nota final y condición (aprobado/desaprobado) están disponibles abajo.
            </p>
          </div>
        </div>
      )}

      {/* KPI tiles — derived from the same Redux state the detail cards fill.
          Only rendered with a selected enrollment: without one no card
          dispatches a fetch, so the tiles would sit in a loading state
          forever. CursoCard shows the "Sin cursos activos" message instead. */}
      {enrollmentView && <SummaryTiles />}

      <CursoCard />

      {enrollmentView && (
        <>
        {/* Below lg: tabs so the page isn't endlessly long. All three cards
            stay MOUNTED (inactive ones are only hidden with CSS): they own the
            fetches that feed SummaryTiles, so unmounting would refetch on every
            tab switch and leave the tiles without data. */}
        <SegmentedToggle
          className="lg:hidden"
          ariaLabel="Detalle del curso"
          options={DETAIL_TABS}
          value={activeTab}
          onChange={setActiveTab}
          idPrefix="alumno-detail"
        />

        {/* lg+: Notas | Asistencia side by side, Cuotas full width below. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div role="tabpanel" id="alumno-detail-panel-notas" aria-labelledby="alumno-detail-tab-notas" className={panelClass("notas")}>
            <NotasCard />
          </div>
          <div role="tabpanel" id="alumno-detail-panel-asistencia" aria-labelledby="alumno-detail-tab-asistencia" className={panelClass("asistencia")}>
            <AsistenciaCard />
          </div>
          <div role="tabpanel" id="alumno-detail-panel-cuotas" aria-labelledby="alumno-detail-tab-cuotas" className={`lg:col-span-2 ${panelClass("cuotas")}`}>
            <CuotasCard />
          </div>
        </div>
        </>
      )}
    </div>
  );
}
