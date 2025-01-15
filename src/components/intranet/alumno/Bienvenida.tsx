"use client";

import { useAppSelector } from "@/redux/stores";
import { IconHeart } from "@tabler/icons-react";
import { Inspiration } from "next/font/google";
import Image from "next/image";

const inspiration = Inspiration({
  weight: ["400"],
  style: "normal",
  subsets: ["latin"],
});

export function Bienvenida() {
  const user = useAppSelector((state) => state.user.userLogin);

  return (
    <div className="rounded-2xl shadow-lg w-full overflow-hidden relative bg-flamingo p-3 flex justify-center gap-6 flex-wrap items-center sm:gap-16 lg:order-1 lg:col-span-2 lg:flex-col lg:p-20 lg:gap-3">
      <div className="z-10 flex flex-col gap-2 mb-5 md:mb-0">
        <h3 className="font-semibold text-3xl lg:text-4xl xl:text-5xl">Hola de nuevo,</h3>
        <h1
          className={`font-semibold text-white text-[6rem] w-full flex justify-center items-center lg:text-[10rem] xl:text-[14rem] xl:h-[14rem] ${inspiration.className}`}>
          {user?.name ? (
            user.name
          ) : (
            <span className="loading loading-dots loading-lg size-20" />
          )}
        </h1>
      </div>
      <div className="w-fit justify-center hidden md:flex">
        <Image
          src="/bienvenida.svg"
          alt="bienvenida"
          width={500}
          height={500}
          className="z-10 size-[10rem] xl:size-[15rem]"
        />
      </div>
      <IconHeart
        size={50}
        className="absolute z-10 text-white bottom-2 right-4 md:hidden"
      />
      <div className="absolute rounded-full size-[250px] bg-yellow z-0 blur-2xl right-[-6rem] lg:size-[450px]" />
      <div className="absolute rounded-full size-[250px] bg-black z-0 blur-2xl right-[-12rem] lg:size-[450px] xl:right-[-15rem]" />
    </div>
  );
}
