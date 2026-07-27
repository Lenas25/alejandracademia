"use client";

import { useAppSelector } from "@/redux/stores";
import { useEffect, useState } from "react";
import { AsistenciaCard } from "./AsistenciaCard";
import { Bienvenida } from "./Bienvenida";
import { ContextStrip } from "./ContextStrip";
import { CourseSelector } from "./CourseSelector";
import { CuotasCard } from "./CuotasCard";
import { CursoCard } from "./CursoCard";
import { NotasCard } from "./NotasCard";
import { PromedioCard } from "./PromedioCard";

export function PanelContent() {
  const userLogin = useAppSelector((state) => state.user.userLogin);
  const enrollmentsUser = useAppSelector((state) => state.enrollment.enrollmentsUser);
  const [isLoading, setIsLoading] = useState(true);

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
      <div className="space-y-6 animate-pulse">
        {/* Bienvenida skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 bg-gray-200 rounded-lg w-72" />
            <div className="h-4 bg-gray-100 rounded w-64" />
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded-full" />
        </div>

        {/* CursoCard + PromedioCard skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gray-200 rounded-2xl h-48" />
          <div className="lg:col-span-1 bg-gray-200 rounded-2xl h-48" />
        </div>

        {/* ContextStrip skeleton */}
        <div className="bg-gray-200 rounded-2xl h-14" />

        {/* NotasCard + AsistenciaCard + CuotasCard skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-200 rounded-2xl h-64" />
          <div className="bg-gray-200 rounded-2xl h-64" />
          <div className="bg-gray-200 rounded-2xl h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <Bienvenida />

      {/* Selector multi-curso — oculto si el alumno tiene solo 1 matrícula */}
      <CourseSelector />

      {/* Header del curso seleccionado + Promedio en curso (hero) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CursoCard />
        </div>
        <div className="lg:col-span-1">
          <PromedioCard />
        </div>
      </div>

      {/* Contexto compacto: fechas de la sección + próxima cuota */}
      <ContextStrip />

      {/* Notas, Asistencia y Cuotas — orden de lectura: Notas → Asistencia →
          Cuotas (agrupación académica). En `lg:grid-cols-2` esto arma
          fila 1 = Notas | Asistencia y fila 2 = Cuotas, preservando el
          mismo orden al colapsar a una columna en mobile. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NotasCard />
        <AsistenciaCard />
        <CuotasCard />
      </div>
    </div>
  );
}
