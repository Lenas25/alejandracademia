"use client";

import { IconMenu2, IconX } from "@tabler/icons-react";
import { useState } from "react";

export function Menu() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex gap-2 items-center relative transition-transform duration-300">
          <IconMenu2 className="transform transition-transform duration-300 lg:size-8" />
        <span className="hidden md:block lg:text-2xl">Menú</span>
      </button>
      <div
        className={`fixed top-0 left-0 h-full w-64 z-50 bg-flamingo shadow-2xl transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300`}>
        <ul className="p-4">
          <li className="py-2 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="transition-transform duration-300">
                <IconX className="transform transition-transform duration-300 lg:size-8" />
            </button>
          </li>
          <li className="py-2">
            <a href="#inicio" className="block transition ease-in-out delay-150 hover:underline lg:text-2xl">
              Inicio
            </a>
          </li>
          <li className="py-2">
            <a href="#about" className="block transition ease-in-out delay-150 hover:underline lg:text-2xl">
              Sobre Nosotros
            </a>
          </li>
          <li className="py-2">
            <a href="#cursos" className="block transition ease-in-out delay-150 hover:underline lg:text-2xl">
              Cursos
            </a>
          </li>
          <li className="py-2">
            <a href="#galeria" className="block transition ease-in-out delay-150 hover:underline lg:text-2xl">
              Galería
            </a>
          </li>
          <li className="py-2">
            <a href="#testimonios" className="block transition ease-in-out delay-150 hover:underline lg:text-2xl">
              Testimonios
            </a>
          </li>
          <li className="py-2">
            <a href="#contacto" className="block transition ease-in-out delay-150 hover:underline lg:text-2xl">
              Contacto
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
