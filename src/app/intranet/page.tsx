import { LoginForm } from "@/components";
import Image from "next/image";
import s from "./login.module.css";

export const metadata = {
  title: "Intranet | Alejandra Academia",
  description:
    "Intranet de Alejandra Academia es un espacio privado para los alumnos y profesores de la academia.",
};

export default function Login() {
  return (
    <div className="p-5 sm:p-28 h-screen flex flex-col gap-10 overflow-hidden justify-center">
      <div className="w-full flex md:justify-center">
      <Image
        src="/nombreLogo.png"
        alt="Alejandra Academia"
        width={200}
        height={200}
        className="lg:w-[300px] z-50"
      />
      </div>
      <div className="bg-white rounded-2xl shadow-lg md:w-[80%] md:m-auto lg:w-[50%] 2xl:w-[35%] lg:flex lg:flex-col lg:gap-5 lg:justify-center p-10 z-50">
        <div>
          <h1 className="text-center font-bold text-4xl">
            Bienvenid@ de Nuevo
          </h1>
          <p className="pt-5 text-center text-lg text-gray-500 lg:text-xl">
            Ingresa tus datos completos para visualizar tus cursos y notas
          </p>
        </div>
        <LoginForm />
      </div>
      <div className="fixed z-10 inset-0 overflow-hidden">
        <Image
          src="/circlePink.svg"
          alt="Circle Pink"
          width={100}
          height={100}
          className={s.pink1}
        />
        <Image
          src="/circlePink.svg"
          alt="Circle Pink"
          width={80}
          height={80}
          className={s.pink2}
        />
        <Image
          src="/circlePink.svg"
          alt="Circle Pink"
          width={40}
          height={40}
          className={s.pink3}
        />
        <Image
          src="/circleYellow.svg"
          alt="Circle Yellow"
          width={50}
          height={50}
          className={s.yellow1}
        />
        <Image
          src="/circleYellow.svg"
          alt="Circle Yellow"
          width={120}
          height={120}
          className={s.yellow2}
        />
        <Image
          src="/waves.svg"
          alt="Ondas de Login"
          width={900}
          height={900}
          className={s.waves}
        />
        
      </div>
    </div>
  );
}
