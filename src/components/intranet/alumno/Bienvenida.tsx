"use client";

import { useAppSelector } from "@/redux/stores";
import { IconHeart } from "@tabler/icons-react";

export function Bienvenida() {
  const user = useAppSelector((state) => state.user.userLogin);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-bold text-gray-800">
        Bienvenida, {user?.name ? user.name : '...'}!
      </h1>
      <p className="text-gray-500 mt-1">
        Aquí tienes un resumen de tu progreso y actividades.
      </p>
      </div>
      <IconHeart className="text-darkpink mt-4" size={48} />
    </div>
  );
}