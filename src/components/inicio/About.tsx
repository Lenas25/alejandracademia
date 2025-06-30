"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const icons = [
  { src: "/maquilladora.webp", alt: "maquilladora" },
  { src: "/mascara.webp", alt: "mascara" },
  { src: "/tratamiento-capilar.webp", alt: "tratamiento-capilar" },
];

export function About() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1, transition: { duration: 1} }}
      id="about"
      className="bg-flamingo py-10 px-3 flex gap-5 items-center flex-col-reverse md:px-14 md:py-12 md:flex-row md:gap-10 md:justify-between 2xl:px-32">
      <div className="relative hidden md:flex justify-center items-center lg:flex-1">
        <div className="absolute w-[270px] lg:w-[350px] xl:w-[450px]">
          <Image
            src="/spa5.webp"
            width={700}
            height={500}
            alt="spa5"
            className="rounded-t-[125px] h-[400px] object-cover lg:rounded-t-[160px] lg:h-[500px] xl:rounded-t-[200px]  xl:h-[700px]"
          />
        </div>
        <div className="w-[300px] lg:w-auto">
          <Image
            className="lg:h-[570px] xl:h-[750px]"
            src="/marcoAbout.svg"
            width={700}
            height={700}
            alt="marcoAbout"
          />
        </div>
      </div>
      <div className="flex gap-10 flex-col justify-center items-center lg:flex-1">
        <div className="flex gap-10 justify-center flex-col">
          <div className="flex gap-2 justify-center flex-col text-center">
            <div className="flex justify-center">
              <h2 className="text-center text-6xl font-semisemibold w-auto md:w-[80%] lg:text-8xl">
                Sobre Nosotros
              </h2>
            </div>
            <div className="flex justify-center">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "80%" }}
                transition={{ duration: 2}}
               className="h-[2px] bg-black lg:h-[4px]" />
            </div>
          </div>
          <p className="text-center text-xl lg:text-3xl">
            <b>Alejandra Academia</b> es un lugar con expresión única y
            diferenciada en el desarrollo de las habilidades a los{" "}
            <b>futuros profesionales</b> de la belleza, con trabajos de calidad
            y excelencia, que les permita una mejor calidad de vida con una{" "}
            <b> alta capacidad de adaptación</b> en el área laboral.
          </p>
        </div>
        <div className="flex gap-5 justify-center">
          <div className="flex gap-5 justify-center">
            {icons.map((icon, index) => (
              <div
                key={index}
                className="relative flex justify-center items-center">
                <div className="absolute w-[50%]">
                  <Image
                    src={icon.src}
                    width={200}
                    height={200}
                    alt={icon.alt}
                  />
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  className="w-[100px] lg:w-full">
                  <Image
                    src="/circleAbout.svg"
                    width={200}
                    height={200}
                    alt="circleAbout"
                  />
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
