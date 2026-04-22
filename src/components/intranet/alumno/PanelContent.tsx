"use client";

import { useAppSelector } from "@/redux/stores";
import { useEffect, useState } from "react";
import { Bienvenida } from "./Bienvenida";
import { Calendario } from "./Calendario";
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
      // Damos un tick para que el thunk dispatch de CursoCard arranque,
      // pero no esperamos su resultado — el CursoCard ya tiene su propio estado interno.
      // El skeleton aquí protege solo la hidratación inicial de Redux.
      setIsLoading(false);
    }
  }, [userLogin, enrollmentsUser]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Fila 1: Bienvenida skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 bg-gray-200 rounded-lg w-72" />
            <div className="h-4 bg-gray-100 rounded w-64" />
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded-full" />
        </div>

        {/* Fila 2: CursoCard + Calendario skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-200 rounded-2xl h-48" />
          <div className="bg-gray-200 rounded-2xl h-48" />
        </div>

        {/* Fila 3: PromedioCard + NotasCard skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-gray-200 rounded-2xl h-64" />
          <div className="lg:col-span-2 bg-gray-200 rounded-2xl h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fila 1: Bienvenida */}
      <Bienvenida />

      {/* Fila 2: Curso y Calendario */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CursoCard />
        <Calendario />
      </div>

      {/* Fila 3: Promedio y Notas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PromedioCard />
        </div>
        <div className="lg:col-span-2">
          <NotasCard />
        </div>
      </div>
    </div>
  );
}
