"use client";

import { useForm } from "react-hook-form";
import type { Login } from "@/types/login";
import { getMe, login } from "@/utils/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Roles } from "@/types/roles";
import { LoadingButton, useSlowFlag } from "./ui/LoadingButton";

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Login>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const slow = useSlowFlag(submitting, 5000);
  const onSubmit = async (data: Login) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    let redirected = false;
    try {
      redirected = await doLogin(data);
    } finally {
      // Keep the form locked while the router navigates away.
      if (!redirected) setSubmitting(false);
    }
  };
  // Resolves true only when a redirect was started.
  const doLogin = async (data: Login): Promise<boolean> => {
    const logeado = await login(data.username, data.password);
    if (logeado.error) {
      setError(logeado.message);
      return false;
    }
    // getMe swallows its own errors and returns null (bad token, network
    // failure, missing user), so a null/role-less result must not reach the
    // router as `/intranet/undefined`.
    const token = localStorage.getItem("token");
    const user = token ? await getMe(token) : null;
    if (!user?.role) {
      setError("No se pudo cargar tu perfil. Inténtalo de nuevo.");
      return false;
    }
    const role = user.role === Roles.TUTOR ? Roles.ADMIN : user.role;
    router.push(`/intranet/${role}`);
    return true;
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5 pt-5">
      <div>
        <input
          type="text"
          placeholder="Usuario"
          className={`p-2 rounded-lg w-full outline-none transition-all ease-in-out delay-150 focus:bg-transparent text-black text-lg lg:p-3 placeholder:text-black  ${
            errors.username
              ? "ring-2 focus:ring-red-700 bg-transparent ring-red-700"
              : "focus:ring-2 focus:ring-black bg-flamingo"
          }`}
          aria-label="Usuario"
          aria-invalid={errors.username ? true : undefined}
          aria-describedby={errors.username ? "login-username-error" : undefined}
          disabled={submitting}
          {...register("username", {
            required: "Este campo es obligatorio",
            minLength: { value: 3, message: "Minimo 3 caracteres" },
          })}
        />
        {errors.username && (
          <p id="login-username-error" className="text-red-700 font-semibold pt-2">
            {errors.username.message}
          </p>
        )}
      </div>
      <div>
        <input
          type="password"
          placeholder="Contraseña"
          className={`p-2 rounded-lg w-full outline-none transition-all ease-in-out delay-150 focus:bg-transparent text-black text-lg lg:p-3 placeholder:text-black ${
            errors.password
              ? "ring-2 focus:ring-red-700 bg-transparent ring-red-700"
              : "focus:ring-2 focus:ring-black bg-flamingo"
          }`}
          aria-label="Contraseña"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "login-password-error" : undefined}
          disabled={submitting}
          {...register("password", {
            required: "Este campo es obligatorio",
            minLength: { value: 3, message: "Minimo 3 caracteres" },
          })}
        />
        {errors.password && (
          <p id="login-password-error" className="text-red-700 font-semibold pt-2">
            {errors.password.message}
          </p>
        )}
        {error && (
          <p role="alert" className="text-red-700 font-semibold pt-2">
            {error}
          </p>
        )}
      </div>
      <LoadingButton
        type="submit"
        loading={submitting}
        loadingText="Iniciando sesión…"
        className="bg-black text-white rounded-lg text-xl font-semibold py-3 lg:mx-auto lg:px-10">
        Iniciar Sesión
      </LoadingButton>
      {slow && (
        <p role="status" aria-live="polite" className="text-black text-center">
          El servidor está tardando más de lo normal. Espera unos segundos, por favor.
        </p>
      )}
    </form>
  );
}
