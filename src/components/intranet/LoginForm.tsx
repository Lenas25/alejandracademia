"use client";

import { useForm } from "react-hook-form";
import type { Login } from "@/types/login";
import { getMe, login } from "@/utils/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Roles } from "@/types/roles";

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Login>();
  const router = useRouter();
  const [error, setError] = useState<string|null>(null);
  const onSubmit = async (data: Login) => {
    const logeado = await login(data.username, data.password);
    if (logeado.error) {
      setError(logeado.message)
      return;
    }
    const user = await getMe(localStorage.getItem("token") as string);
    const role = user?.role === Roles.TUTOR ? Roles.ADMIN : user?.role;
    router.push(`/intranet/${role}`);
    
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5 pt-5">
      <div>
        <input
          type="text"
          placeholder="Usuario"
          className={`p-2 rounded-lg w-full outline-none transition-all ease-in-out delay-150 focus:bg-transparent text-black text-lg lg:p-3  ${errors.username ? "ring-2 focus:ring-red-700 bg-transparent ring-red-700" : "focus:ring-2 focus:ring-yellow bg-lightpink"}`}
          {...register("username", {
            required: "Este campo es obligatorio",
            minLength: { value: 3, message: "Minimo 3 caracteres" },
          })}
        />
        {errors.username && <p className="text-red-700 font-semibold pt-2">{errors.username.message}</p>}
      </div>
      <div>
        <input
          type="password"
          placeholder="Contraseña"
          className={`p-2 rounded-lg w-full outline-none transition-all ease-in-out delay-150 focus:bg-transparent text-black text-lg lg:p-3 ${errors.password ? "ring-2 focus:ring-red-700 bg-transparent ring-red-700" : "focus:ring-2 focus:ring-yellow bg-lightpink"}`}
          {...register("password", {
            required: "Este campo es obligatorio",
            minLength: { value: 3, message: "Minimo 3 caracteres" },
          })}
        />
        {errors.password && <p className="text-red-700 font-semibold pt-2">{errors.password.message}</p>}
        {
          error && <p className="text-red-700 font-semibold pt-2">{error}</p>
        }
      </div>
      <button type="submit" className="bg-black text-white rounded-lg text-xl font-semibold py-3 lg:mx-auto lg:px-10">Iniciar Sesión</button>
    </form>
  );
}
