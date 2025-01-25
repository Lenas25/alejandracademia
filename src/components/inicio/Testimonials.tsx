"use client";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import TestimonialsInfo from "./TestimonialsInfo";
import { useState } from "react";

const testimonialsExample = [
  {
    id: 1,
    text: "La Academia Alejandra ha sido una experiencia transformadora para mí. Los profesores son increíblemente dedicados y siempre están dispuestos a brindar apoyo. Gracias a sus clases de estilismo y cuidado de la piel, he mejorado significativamente mis habilidades y ahora me siento mucho más segura para atender a mis clientes. ¡Recomiendo esta academia a todas mis amigas!",
    name: "María Pérez",
  },
  {
    id: 2,
    text: "Estoy profundamente agradecida con la Academia Alejandra. Sus clases de maquillaje profesional han sido fundamentales para mejorar mi técnica y confianza al trabajar. Los métodos de enseñanza son muy efectivos y los profesores son extremadamente amables y profesionales. Sin duda, elegir esta academia ha sido una de las mejores decisiones para mi carrera en el mundo del estilismo.",
    name: "Ana González",
  },
  {
    id: 3,
    text: "La Academia Alejandra ha superado todas mis expectativas. Los cursos de peluquería y tratamientos capilares son excepcionales y los instructores tienen un conocimiento profundo del tema. He aprendido a realizar cortes y peinados modernos, y ahora estoy trabajando en mi propio salón. ¡Gracias, Academia Alejandra, por proporcionarme las herramientas necesarias para alcanzar mis metas!",
    name: "Carla Rodríguez",
  },
];


export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevClick = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? testimonialsExample.length - 1 : prevIndex - 1
    );
  };

  const handleNextClick = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === testimonialsExample.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <section
      id="testimonios"
      className="mb-12 relative py-10 px-3 flex flex-col gap-5 items-center md:px-14 md:py-12 md:flex-row md:gap-10 md:justify-between 2xl:px-32">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/makeup.webp')" }}/>
      <div className="absolute inset-0 bg-yellow opacity-75" />
      <div className="flex flex-col gap-10 z-10 lg:flex-1">
        <div className="flex gap-2 justify-center flex-col text-center">
          <div className="flex justify-center">
            <h2 className="text-center text-6xl font-semibold w-auto xl:text-8xl">
              Testimonios
            </h2>
          </div>
          <div className="flex justify-center">
            <div className="h-[2px] bg-black w-[60%] lg:h-[4px]" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-5">
          <IconChevronLeft
            size={50}
            className="transition ease-in-out delay-150 p-1 border-2 border-black shadow-xl rounded-full  hover:bg-white hover:border-white"
            onClick={handlePrevClick}
          />
          <IconChevronRight
            size={50}
            className="transition ease-in-out delay-150 p-1 border-2 border-black shadow-xl rounded-full  hover:bg-white hover:border-white"
            onClick={handleNextClick}
          />
        </div>
      </div>
      <div className="flex justify-center w-full lg:flex-1">
        <TestimonialsInfo
          key={testimonialsExample[currentIndex].id}
          testimonial={testimonialsExample[currentIndex]}
        />
      </div>
    </section>
  );
}
