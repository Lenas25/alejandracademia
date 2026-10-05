"use client";

import { useAppSelector } from "@/redux/stores";

export function Bienvenida() {
  const user = useAppSelector((state) => state.user.userLogin);

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
        Hola, {user?.name ? user.name : "..."}
      </h1>
      <p className="text-gray-500 mt-0.5 text-sm md:text-base">
        Aquí tienes un resumen de tu progreso y actividades.
      </p>
    </div>
  );
}
