"use client";

import { Inspiration } from "next/font/google";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const inspiration = Inspiration({
  weight: ["400"],
  style: "normal",
  subsets: ["latin"],
});

const images = [
  {
    id: 1,
    src: "/spa2.webp",
    alt: "spa1",
    width: 700,
    height: 700,
  },
  {
    id: 2,
    src: "/spa4.webp",
    alt: "spa2",
    width: 700,
    height: 700,
  },
  {
    id: 3,
    src: "/spa7.webp",
    alt: "spa2",
    width: 700,
    height: 700,
  },
];

const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

export function Header() {
  const [selectedImagen, setSelectedImagen] = useState(images[0]);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const cycleImages = () => {
      setFade(false);
      setTimeout(() => {
        setSelectedImagen((prevImage) => {
          const currentIndex = images.findIndex(
            (image) => image.id === prevImage.id
          );
          const nextIndex = (currentIndex + 1) % images.length;
          return images[nextIndex];
        });
        setFade(true);
      }, 500);
    };

    const interval = setInterval(cycleImages, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className="py-5 px-3 flex gap-5 items-center flex-col-reverse md:px-14 md:py-12 md:flex-row md:gap-10 md:justify-between xl:py-[7rem] 2xl:px-32"
      id="inicio">
      <div className="flex flex-col items-center lg:items-start z-0">
        <p className="text-center text-3xl font-semibold lg:text-4xl xl:text-5xl">
          Nuestra guía para transformar el mundo de la belleza. Es...
        </p>
        <div className="flex justify-center w-full">
          <h1
            className={`text-center text-darkpink text-[7rem] md:text-[5rem] lg:text-[6rem] xl:text-[10rem] 2xl:text-[10rem] ${inspiration.className}`}>
            Tu Talento
          </h1>
        </div>
        <div className="flex items-center justify-center w-full">
          <a
            href="https://wa.me/584247247939?text=¡Hola!%20Estoy%20interesado/a%20en%20obtener%20más%20información%20sobre%20la%20Academia%20Alejandra.%20¿Podrías%20ayudarme%20con%20los%20detalles%3F%20Gracias%21"
            className="px-10 py-2 bg-black border-4 text-white transition delay-300 ease-in-out font-semibold hover:bg-transparent hover:text-black hover:border-black text-2xl 2xl:text-4xl xl:py-5">
            ¡Inscríbete ahora!
          </a>
        </div>
      </div>

      <div className="flex gap-3 flex-col lg:flex-row 2xl:gap-16">
        <div className="flex justify-center relative">
          <motion.div
            className="w-[300px] h-[300px] lg:w-[500px] lg:h-[500px]"
            initial="hidden"
            animate={fade ? "visible" : "hidden"}
            variants={fadeVariants}>
            <Image
              className="rounded-full w-full h-full object-cover"
              src={selectedImagen.src}
              alt={selectedImagen.alt}
              width={selectedImagen.width}
              height={selectedImagen.height}
              priority={selectedImagen.id === 1}
            />
          </motion.div>
          <div className="absolute flex gap-2 top-[120px] -right-4 xl:top-[200px] xl:-right-6 2xl:top-[350px] 2xl:-right-[150px] xl:gap-5">
            <div className="w-[50px] h-[100px] xl:w-auto xl:h-auto">
              <Image
                src="/headerLeft.svg"
                alt="decoracionVector"
                width={100}
                height={150}
                loading="eager"
              />
            </div>
            <div className="w-[50px] h-[100px] xl:w-auto xl:h-auto">
              <Image
                src="/headerRight.svg"
                alt="decoracionVector"
                width={100}
                height={150}
                loading="eager"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-center lg:flex-col lg:justify-start">
          {images.map((image, index) => (
            <button
              key={image.id}
              className={`h-5 w-5 rounded-full cursor-pointer lg:size-7 ${
                image.id === selectedImagen.id ? "bg-darkpink" : "bg-grey"
              }`}
              aria-label={`Seleccionar imagen ${index + 1}`}
              onClick={() => setSelectedImagen(images[index])}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
