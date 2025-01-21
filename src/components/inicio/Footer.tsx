import {
  IconBrandInstagram,
  IconBrandWhatsappFilled,
  IconChevronRight,
  IconMap2,
} from "@tabler/icons-react";
import Image from "next/image";
import { Inspiration } from "next/font/google";

const inspiration = Inspiration({
  weight: ["400"],
  style: "normal",
  subsets: ["latin"],
});

export function Footer() {
  return (
    <footer
      id="contacto"
      className=" flex flex-col overflow-y-hidden">
      <div className=" w-full bg-background z-1 xl:h-[150px]"/>
      <div className="flex flex-col-reverse md:flex-row md:bg-black md:justify-between lg:h-[400px] lg:gap-10 xl:h-[500px]">
        <div className="bg-black text-white py-5 px-6 flex md:flex-2 lg:flex-auto flex-col gap-5 md:pl-10 md:py-12 xl:gap-10 justify-center xl:justify-normal">
          <div className="flex gap-3 flex-col 2xl:w-[80%] 2xl:pl-16">
            <h4 className="text-xl lg:text-3xl">Ubicación</h4>
            <div className="flex gap-5 justify-between items-center">
              <div className="flex gap-2 items-center lg:text-xl">
                <IconMap2 className="lg:size-8 xl:size-10" />
                <p>3158, Caja Seca, Venezuela</p>
              </div>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://www.google.com/maps/place/Academia+Alejandra/@9.1422473,-71.0791512,15z/data=!4m2!3m1!1s0x0:0xe53fe5574a90da2b?sa=X&ved=1t:2428&hl=es&ictx=111"
                className="p-2 border-2 border-transparent bg-flamingo text-black rounded-full transition ease-in-out delay-150 hover:border-white hover:text-white hover:bg-transparent">
                <IconChevronRight className="lg:size-8 xl:size-10" />
              </a>
            </div>
          </div>
          <div className="flex gap-10 justify-between xl:pb-10 2xl:w-[80%] 2xl:pl-16">
            <div className="flex flex-col gap-3">
              <h4 className="text-xl lg:text-3xl">Horario de Atención</h4>
              <div className="flex flex-col gap-4 lg:text-xl">
                <div className="flex flex-col gap-1">
                  <p>Lunes a Viernes</p>
                  <p>8:00 am - 5:00 pm</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p>Sabados</p>
                  <p>8:00 am - 5:00 pm</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-5 justify-end">
              <a
                href="https://wa.me/584247247939?text=¡Hola!%20Estoy%20interesado/a%20en%20obtener%20más%20información%20sobre%20la%20Academia%20Alejandra.%20¿Podrías%20ayudarme%20con%20los%20detalles%3F%20Gracias%21"
                className="p-2 text-black bg-white rounded-full transition ease-in-out delay-150 hover:text-white hover:bg-transparent">
                <IconBrandWhatsappFilled className="lg:size-8 xl:size-10" />
              </a>
              <a
                href="https://www.instagram.com/alejandraacademia?igsh=MXAzd2EycGt5a216Yg=="
                className="p-2 text-black bg-white rounded-full transition ease-in-out delay-150 hover:text-white hover:bg-transparent">
                <IconBrandInstagram className="lg:size-8 xl:size-10" />
              </a>
            </div>
          </div>
        </div>
        <div className="relative z-5 flex justify-end md:flex-1 2xl:flex-1">
          <div className="absolute w-full h-full flex justify-end z-10 lg:bottom-10 xl:bottom-14 xl:left-0">
            <div className="flex flex-col justify-center w-full items-center">
              <div className="z-20 text-center flex flex-col justify-center w-full items-center">
                <h3 className="text-5xl font-semibold 2xl:text-6xl">SIGUENOS</h3>
                <p
                  className={`text-[4rem] text-white 2xl:text-[5rem] ${inspiration.className}`}>
                  @alejandraacademia
                </p>
              </div>
              <div className="w-[50%]">
                <Image src="/spa8.jpg" alt="spa8" width={500} height={500} />
              </div>
            </div>
          </div>
          <div className="relative w-full flex justify-end z-1 lg:bottom-[124px] lg:h-[900px] xl:w-[800px] xl:-top-[200px] 2xl:h-[1000px] 2xl:w-[1000px] 2xl:-top-[470px]">
            <Image
              className="h-full 2xl:h-[1500px] 2xl:w-[1500px]"
              src="/bubbleFooter.svg"
              alt="bubble"
              width={900}
              height={900}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
