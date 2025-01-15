"use client";
import { useAppSelector } from "@/redux/stores";
import { Roles } from "@/types/roles";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Inicio() {
  const router = useRouter();
  const userLogin = useAppSelector((state) => state.user?.userLogin);

  useEffect(() => {
    if (userLogin?.role === Roles.ADMIN) {
      router.push("./admin/alumnos");
    }else{
    router.push("./admin/cursos");
    }
  }, [router, userLogin]);

  return <></>;
}
