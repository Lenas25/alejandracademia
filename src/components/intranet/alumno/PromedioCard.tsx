"use client";

import { useAppSelector } from "@/redux/stores";
import { IconChartBar } from "@tabler/icons-react";
import Image from "next/image";

export function PromedioCard() {
  const enrollmentView = useAppSelector(
    (state) => state.enrollment.enrollmentView
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 flex flex-col gap-5 justify-center lg:order-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl">Promedio</h3>
        <IconChartBar size={30} />
      </div>
      <div className="relative flex justify-center items-center gap-5 z-0">
        <div className="absolute top-0 translate-x-16 size-28 bg-black text-white rounded-full p-6 flex justify-center items-center">
          <p className="text-4xl font-semibold">
            {enrollmentView?.final_grade || 0.0}
          </p>
        </div>
       <div className="flex flex-col items-center">
       <div className="size-60 lg:size-52 xl:size-60">
          <Image
            src="/chart.svg"
            alt="promedio"
            width={500}
            height={500}
            className="size-full"
          />
        </div>
        { enrollmentView?.final_grade &&
          enrollmentView?.final_grade >= 15 ? (
            <p className="text-green-500 font-semibold text-xl">Aprobado</p>
          ) : (
            <p className="text-red-500 font-semibold text-xl">Desaprobado</p>
          )
        }
       </div>
      </div>
    </div>
  );
}
