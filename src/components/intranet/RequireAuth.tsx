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
      ["admin", new Set(["/intranet/admin", "/intranet/admin/alumnos", "/intranet/admin/cursos", "/intranet/admin/asignar", "/intranet/admin/notas", "/intranet/alumno/panel"])],
      ["alumno", new Set(["/intranet/alumno/panel", "/intranet/alumno"])],
      ["tutor", new Set(["/intranet/admin", "/intranet/admin/cursos", "/intranet/admin/asignar", "/intranet/admin/notas"])],
    ]);
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token && !isTokenExpired(token)) {
        const user = await getMe(token);
        dispatch(setUser(user));

        const userRole = user.role;
        const currentPath = window.location.pathname;
        if (allowedRoutes.get(userRole)?.has(currentPath)) {
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
