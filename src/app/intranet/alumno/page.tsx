"use client";
import { useRouter } from "next/navigation"; 
import { useEffect } from "react";

export default function Inicio() {
  
  const router = useRouter();
  useEffect(() => {
    router.push("./alumno/panel");
  }, [router]);
  return (
    <></>
  )
}