"use client";

import { setUser } from "@/redux/slices/userSlice";
import { useAppDispatch } from "@/redux/stores";
import { getMe, isTokenExpired } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function RequireAuth({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showPage, setShowPage] = useState(false);

  useEffect(() => {
    const allowedRoutes = new Map([
      ["admin", ["/intranet/admin", "/intranet/admin/alumnos", "/intranet/admin/cursos", "/intranet/admin/secciones", "/intranet/admin/constancia", "/intranet/alumno/panel"]],
      ["alumno", ["/intranet/alumno/panel", "/intranet/alumno"]],
      ["tutor", ["/intranet/admin", "/intranet/admin/cursos", "/intranet/admin/secciones"]],
    ]);
    const isAllowedPath = (role: string | undefined, currentPath: string) => {
      const routes = allowedRoutes.get(role ?? "");
      if (!routes) return false;
      return routes.some(
        (route) => currentPath === route || currentPath.startsWith(`${route}/`)
      );
    };
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token && !isTokenExpired(token)) {
        const user = await getMe(token);
        if (!user) {
          // The token is valid but its user is gone (deleted, DB reseeded) or the
          // profile request failed: drop the session instead of crashing.
          localStorage.removeItem("token");
          dispatch(setUser(null));
          setShowPage(false);
          router.replace("/intranet");
          return;
        }
        dispatch(setUser(user));

        const userRole = user.role;
        const currentPath = window.location.pathname;
        if (isAllowedPath(userRole, currentPath)) {
          setShowPage(true);
        } else {
          setShowPage(false);
          localStorage.removeItem("token");
          router.push("/intranet");
        }
      } else {
        if (localStorage.getItem("token")) {
          localStorage.removeItem("token");
        }
        setShowPage(false);
        router.push("/intranet");
      }
    };
    checkAuth();
  }, [dispatch, router]);

  return (
    <>
      {showPage ? (
        children
      ) : (
        <div className="h-screen w-full flex items-center justify-center">
          <span className="loading loading-ring loading-lg" />
        </div>
      )}
    </>
  );
}

export default RequireAuth;
