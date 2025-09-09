"use client";

import { IconCircleDashedPlus } from "@tabler/icons-react";
import Image from "next/image";
import { motion } from "framer-motion";

export function Gallery() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1, transition: { duration: 1 } }}
      id="galeria"
      className="relative py-10 flex gap-5 items-center flex-col md:px-14 md:py-12 md:gap-10 md:justify-between">
      <div className="absolute z-0 left-0 top-10">
        <Image
          src="/bubbleGallery.svg"
          alt="bubbleGallery"
          width={900}
          height={900}
        />
      </div>
      <div className="z-10 flex gap-2 justify-center flex-col text-center">
        <div className="flex justify-center">
          <h2 className="text-center text-6xl font-semisemibold w-auto lg:text-8xl">
            Galería
          </h2>
        </div>
        <div className="flex justify-center">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "80%" }}
            transition={{ duration: 2 }}
            className="h-[2px] bg-black lg:h-[4px]"
          />
        </div>
      </div>
      <div className="m-5 relative gap-2 z-10 grid grid-rows-[300px_300px_300px] md:grid-rows-[300px_300px_300px] grid-cols-2 md:grid-cols-3">
        <div className="col-span-2 row-span-2">
          <Image
            className="w-full h-full object-cover"
            src="/spa1.webp"
            alt="Trabajo con uñas"
            sizes="(max-width: 768px) 100vw, 50vw"
            width={700}
            height={700}
          />
        </div>
        <div className="row-span-1 col-span-1">
          <Image
            className="w-full h-full object-cover"
            src="/spa3.webp"
            alt="Alumnas celebrando"
            sizes="(max-width: 768px) 100vw, 50vw"
            width={700}
            height={700}
          />
        </div>
        <div className="hidden md:block">
          <Image
            className="w-full h-full object-cover"
            src="/spa7.webp"
            alt="Clases de Alejandra Academia"
            sizes="(max-width: 768px) 100vw, 50vw"
            width={700}
            height={700}
          />
        </div>
        <div>
          <Image
            className="w-full h-full object-cover"
            src="/spa5.webp"
            alt="Aplicando Mascarilla"
            sizes="(max-width: 768px) 100vw, 50vw"
            width={700}
            height={700}
          />
        </div>
        <div className="hidden md:block">
          <Image
            className="w-full h-full object-cover"
            src="/spa4.webp"
            alt="Gorra de graduación"
            sizes="(max-width: 768px) 100vw, 50vw"
            width={700}
            height={700}
          />
        </div>
        <a
          href="https://www.instagram.com/alejandraacademia?igsh=MXAzd2EycGt5a216Yg=="
          target="_blank"
          rel="noreferrer"
          className="relative hidden md:flex justify-center items-center">
          <div className="absolute bg-black/50 backdrop-blur-sm bg-opacity-50 inset-0 z-10" />
          <Image
            className="w-full h-full object-cover z-0"
            src="/spa8.webp"
            alt="Grupo de graduación"
            sizes="(max-width: 768px) 100vw, 50vw"
            width={700}
            height={700}
            loading="lazy"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
            className="absolute z-20"
            >
            <IconCircleDashedPlus className="text-white size-[6rem]" />
          </motion.div>
        </a>
      </div>
    </motion.section>
  );
}
