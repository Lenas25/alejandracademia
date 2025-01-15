"use client";

import {
  IconBook,
  IconClipboardList,
  IconLayoutDashboardFilled,
  IconLogout2,
  IconStarsFilled,
  IconUsersGroup,
} from "@tabler/icons-react";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation"; // Cambia esto a next/navigation
import SidebarLink from "./SidebarLink";
import { useAppSelector } from "@/redux/stores";
import { Roles } from "@/types/roles";
import {
  AdminRoutes,
  AlumnoRouter,
  AlumnoRoutes,
  TutorRouter,
  TutorRoutes,
} from "@/utils/frontRouter";

export function Sidebar({ pathname }: { pathname: string }) {
  const user = useAppSelector((state) => state.user.userLogin);
  const router = useRouter();
  const role = user?.role === Roles.TUTOR ? Roles.ADMIN : user?.role;
  const path = pathname.replace(`/intranet/${role}`, "");

  const userLogout = () => {
    localStorage.removeItem("token");
    router.push("..");
  };

  const getRoutesByRole = (role: string | undefined) => {
    switch (role) {
      case Roles.ADMIN:
        return AdminRoutes;
      case Roles.TUTOR:
        return TutorRoutes;
      case Roles.ALUMNO:
        return AlumnoRoutes;
      default:
        return [];
    }
  };

  const routes = getRoutesByRole(user?.role);

  return (
    <div className="fixed z-50 p-5 left-0 w-full bottom-0 md:top-0 md:w-[9rem] md:h-full">
      <div className="relative flex flex-col gap-5 py-3 md:p-5 bg-black text-white shadow-lg h-full rounded-full">
        <div className="hidden w-full md:flex justify-center items-center">
          <Image
            src="/logoSpa.svg"
            alt="logoSpa"
            width={200}
            height={200}
            className="size-full"
          />
        </div>
        <ul className="flex md:flex-col gap-2 justify-center md:justify-between h-full items-center px-5 md:px-0 md:py-5">
          <div className="flex flex-wrap gap-2 md:flex-col md:gap-5">
            {routes.map((route) => (
              <SidebarLink
                key={route.id}
                href={route.href}
                icon={<route.icon size={30} className="md:size-10" />}
                label={route.label}
                isActive={path === route.pathRoute}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={userLogout}
            className="relative text-lg p-2 font-semibold cursor-pointer rounded-full transition-all delay-150 ease-in-out hover:bg-rose md:p-4 group">
            <IconLogout2 size={30} className="md:size-10" />
            <span className="absolute -top-1/2 left-0 md:left-full ml-2 md:top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-black text-white text-sm rounded px-2 py-1 transition-opacity duration-300">
              Salir
            </span>
          </button>
        </ul>
      </div>
    </div>
  );
}
