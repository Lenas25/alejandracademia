"use client";

import {
  IconLogout2,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";
import Image from "next/image";
import { useRouter } from "next/navigation"; // Cambia esto a next/navigation
import { useEffect, useState } from "react";
import SidebarLink from "./SidebarLink";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { setUser } from "@/redux/slices/userSlice";
import { Roles } from "@/types/roles";
import {
  AdminRoutes,
  AlumnoRoutes,
  TutorRoutes,
} from "@/utils/frontRouter";

export function Sidebar({ pathname }: { pathname: string }) {
  const user = useAppSelector((state) => state.user.userLogin);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const role = user?.role === Roles.TUTOR ? Roles.ADMIN : user?.role;
  const path = pathname.replace(`/intranet/${role}`, "");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Close the drawer on every route change (link tap already closes it via
  // `onNavigate`, this also covers back/forward navigation and programmatic
  // redirects like the ones `userLogout` triggers).
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  // Clear both the auth token AND the Redux user, then go to the intranet
  // login (`/intranet`) with an absolute `replace`. The previous
  // `router.push("..")` was a RELATIVE navigation — from a deep route like
  // `/intranet/admin/secciones` it only went up one segment
  // (`/intranet/admin`), which is why logout appeared to need several
  // clicks. `replace` also keeps the back button from returning into the
  // authenticated area after logout.
  const userLogout = () => {
    localStorage.removeItem("token");
    dispatch(setUser(null));
    router.replace("/intranet");
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
    <>
      {/* ---- MOBILE (<md): hamburger trigger + slide-in drawer ---- */}
      {/* Fixed top-left, small and on-palette — replaces the old fixed
          bottom pill entirely below `md`. `z-50` matches the desktop
          sidebar's stacking so it always sits above page content. */}
      <button
        type="button"
        onClick={() => setIsMobileNavOpen((open) => !open)}
        aria-expanded={isMobileNavOpen}
        aria-controls="intranet-mobile-nav"
        aria-label={isMobileNavOpen ? "Cerrar menú" : "Abrir menú"}
        className="md:hidden fixed z-50 top-4 left-4 flex items-center justify-center size-11 rounded-full bg-black text-white shadow-lg">
        {isMobileNavOpen ? <IconX size={22} /> : <IconMenu2 size={22} />}
      </button>

      {/* Backdrop — tap to close. `pointer-events-none` while hidden so it
          never intercepts taps on the page underneath. */}
      <div
        onClick={() => setIsMobileNavOpen(false)}
        aria-hidden="true"
        className={`md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isMobileNavOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer — transform-based slide-in, no daisyUI drawer checkbox
          needed. Closes on backdrop tap, on link tap (SidebarLink's
          `onNavigate`), and on any route change (effect above). */}
      <div
        id="intranet-mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className={`md:hidden fixed z-50 top-0 left-0 h-full w-64 max-w-[80%] flex flex-col gap-2 bg-black text-white shadow-lg transition-transform duration-300 ease-out ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
        <div className="flex items-center justify-between p-4 pl-5">
          <Image src="/brand/logoSpa.webp" alt="logoSpa" width={120} height={40} className="h-9 w-auto" />
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Cerrar menú"
            className="flex items-center justify-center size-9 rounded-full hover:bg-rose">
            <IconX size={20} />
          </button>
        </div>
        <ul className="flex flex-col gap-1 px-3 overflow-y-auto flex-1">
          {routes.map((route) => (
            <li key={route.id}>
              <SidebarLink
                variant="row"
                href={route.href}
                icon={<route.icon size={22} />}
                label={route.label}
                isActive={path === route.pathRoute || path.startsWith(`${route.pathRoute}/`)}
                onNavigate={() => setIsMobileNavOpen(false)}
              />
            </li>
          ))}
        </ul>
        <div className="p-3 border-t border-white/10">
          <button
            type="button"
            onClick={userLogout}
            className="flex items-center gap-3 w-full rounded-lg px-4 py-3 text-base font-medium text-white/80 hover:bg-rose hover:text-white transition-colors">
            <IconLogout2 size={22} className="shrink-0" />
            Salir
          </button>
        </div>
      </div>

      {/* ---- DESKTOP (md+): fixed left sidebar, unchanged ---- */}
      <div className="hidden md:block md:fixed md:z-50 md:p-5 md:left-0 md:top-0 md:w-[9rem] md:h-full">
        <div className="relative flex flex-col gap-5 py-3 md:p-5 bg-black text-white shadow-lg h-full rounded-full">
          <div className="hidden w-full md:flex justify-center items-center">
            <Image
              src="/brand/logoSpa.webp"
              alt="logoSpa"
              width={200}
              height={200}
              className="size-full"
            />
          </div>
          <ul className="flex md:flex-col gap-3 justify-center md:justify-between h-full items-center px-4 md:px-0 md:py-5 overflow-x-auto md:overflow-visible">
            <div className="flex flex-nowrap gap-3 md:flex-col md:gap-5">
              {routes.map((route) => (
                <SidebarLink
                  key={route.id}
                  href={route.href}
                  icon={<route.icon size={30} className="md:size-10" />}
                  label={route.label}
                  isActive={path === route.pathRoute || path.startsWith(`${route.pathRoute}/`)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={userLogout}
              aria-label="Salir"
              className="relative flex items-center justify-center shrink-0 min-w-11 min-h-11 text-lg font-semibold cursor-pointer rounded-full transition-all delay-150 ease-in-out hover:bg-rose p-2 md:p-4 md:min-w-0 md:min-h-0 group">
              <IconLogout2 size={30} className="md:size-10" />
              {/* Desktop-only tooltip — see SidebarLink for why it's hidden
                  on mobile (no hover state on touch, odd flash position). */}
              <span className="hidden md:block absolute md:left-full md:top-1/2 ml-2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-black text-white text-sm rounded px-2 py-1 transition-opacity duration-300">
                Salir
              </span>
            </button>
          </ul>
        </div>
      </div>
    </>
  );
}
