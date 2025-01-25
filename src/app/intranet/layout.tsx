"use client";
import { Roles } from "@/types/roles";
import { getMe, isTokenExpired } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  useEffect(() => {
    const verificar = async () => {
      const token = localStorage.getItem("token");
      if (token && !isTokenExpired(token)) {
        const user = await getMe(localStorage.getItem("token") as string);
        const role = user?.role === Roles.TUTOR ? Roles.ADMIN : user?.role;
        router.push(`/intranet/${role}`);
      }
      router.push("/intranet");
    };
    verificar();
  }, [router]);

  return(
  { children }
  );
}
