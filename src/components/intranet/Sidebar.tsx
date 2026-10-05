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
import { useUnsavedGuard } from "@/components/intranet/ui/UnsavedChanges";
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
  const { confirmLeave } = useUnsavedGuard();
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

  // Logging out discards any unsaved form state, so ask first when dirty.
  const requestLogout = () => confirmLeave(() => userLogout());

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
            onClick={() => {
              // Close the drawer so the confirm dialog is not shown over it.
              setIsMobileNavOpen(false);
              requestLogout();
            }}
            className="flex items-center gap-3 w-full rounded-lg px-4 py-3 text-base font-medium text-white/80 hover:bg-rose hover:text-white transition-colors">
            <IconLogout2 size={22} className="shrink-0" />
            Salir
          </button>
        </div>
      </div>

      {/* ---- DESKTOP (md+): slim fixed rail (w-20 = 80px) ---- */}
      {/* Icon + always-visible 11px label per item. Worst case is 5 items
          (admin) + logo + logout ~ 430px, so it fits 700-800px viewport
          heights; the nav list scrolls (hidden scrollbar) if it ever doesn't.
          Layouts offset content with md:pl-[84px] / md:pl-[72px] (see
          the admin and alumno layout files) — keep in sync if the width changes. */}
      <aside
        aria-label="Navegación principal"
        className="hidden md:flex md:fixed md:z-50 md:left-4 md:top-4 md:bottom-4 md:w-20 flex-col items-center gap-3 py-4 bg-black text-white shadow-lg rounded-2xl">
        <Image
          src="/brand/logoSpa.webp"
          alt="logoSpa"
          width={120}
          height={120}
          className="w-12 h-auto shrink-0"
        />
        <nav aria-label="Secciones" className="flex-1 min-h-0 w-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex flex-col items-center gap-1.5 px-1.5">
            {routes.map((route) => (
              <li key={route.id} className="w-full">
                <SidebarLink
                  variant="rail"
                  href={route.href}
                  icon={<route.icon size={24} />}
                  label={route.label}
                  isActive={path === route.pathRoute || path.startsWith(`${route.pathRoute}/`)}
                />
              </li>
            ))}
          </ul>
        </nav>
        <div className="w-full px-1.5 shrink-0">
          <button
            type="button"
            onClick={requestLogout}
            aria-label="Salir"
            className="flex flex-col items-center justify-center gap-1 w-full min-h-14 rounded-xl px-1 py-2 text-white/80 hover:bg-rose hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <IconLogout2 size={24} className="shrink-0" />
            <span className="text-[11px] leading-none font-medium">Salir</span>
          </button>
        </div>
      </aside>
    </>
  );
}
