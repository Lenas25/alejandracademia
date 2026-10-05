"use client";

import { Roles } from "@/types/roles";
import { CreateUser, User } from "@/types/user";
import {
  IconEdit,
  IconMailFilled,
  IconPhoneFilled,
  IconPlus,
  IconUserCircle,
  IconUserFilled,
  IconKeyFilled,
  IconEPassport,
} from "@tabler/icons-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/redux/stores";
import { createUser, updateUser } from "@/redux/service/userService";
import { PayloadAction } from "@reduxjs/toolkit";
import { useToast } from "@/components/intranet/ui/Toast";
import { LoadingButton } from "@/components/intranet/ui/LoadingButton";

// Mirrors the backend CreateUserDto (MinLength + IsEmail). Values are trimmed
// before measuring because the API trims name/lastName/email/username.
// UpdateUserDto is PartialType(CreateUserDto), so in edit mode a minimum only
// applies to values the admin changed: `original` (edit mode) lets unchanged
// legacy values through.
const minTrimmed = (min: number, label: string, original?: string) => (value: unknown) => {
  const v = String(value ?? "");
  if (original !== undefined && v === original) return true;
  return v.trim().length >= min || `${label} debe tener al menos ${min} caracteres`;
};

interface ModalEditAddProps {
  selectedUser: User | null;
  setOpenModal: (isOpen: { active: boolean; type: string }) => void;
  setSelectedUser: (user: User | null) => void;
  isOpenModal: { active: boolean; type: string };
  modalMessage: { title: string; message: string };
}

function ModalEditAdd({
  selectedUser,
  setOpenModal,
  isOpenModal,
  modalMessage,
  setSelectedUser,
}: ModalEditAddProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<User>({
    defaultValues: selectedUser
      ? {
          id: selectedUser.id,
          name: selectedUser.name,
          lastName: selectedUser.lastName,
          username: selectedUser.username,
          email: selectedUser.email,
          role: selectedUser.role,
          phone: selectedUser.phone,
          password: "",
        }
      : {},
  });

  const isEdit = isOpenModal.type === "edit";
  const orig = (v: string | undefined) => (isEdit ? v ?? "" : undefined);

  const dispatch = useAppDispatch();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: User) => {
    setError(null);
    try {
      let resultAction: PayloadAction<{
        message: string;
        data: CreateUser | User;
      }>;
      if (isOpenModal.type === "edit") {
        const updatedUser = {
          ...data,
          name: data.name,
          lastName: data.lastName,
          username: data.username,
          role: Roles[
            (data.role || Roles.ALUMNO).toUpperCase() as keyof typeof Roles
          ].toLowerCase(),
          ...(data.password && { password: data.password }),
        };
        resultAction = (await dispatch(
          updateUser({
            userId: selectedUser?.id?.toString(),
            data: updatedUser,
          })
        )) as PayloadAction<{ message: string; data: User }>;
      } else {
        resultAction = (await dispatch(createUser(data))) as PayloadAction<{
          message: string;
          data: CreateUser;
        }>;
      }
      const payload = resultAction.payload as { message: string; error?: string };
      if (payload?.error) {
        // Thunk fulfilled with a Spanish `error`: keep the modal open.
        setError(payload.error);
        return;
      }
      setSelectedUser(null);
      toast.success(payload.message);
      setOpenModal({ active: false, type: "" });
    } catch (error) {
      console.error(error);
      setError("Error al guardar el usuario");
    }
  };

  const reset = () => {
    setSelectedUser(null);
    setOpenModal({ active: false, type: "" });
  };

  return (
    <dialog
      open={isOpenModal.active}
      className="modal modal-bottom sm:modal-middle backdrop-blur-sm"
      onCancel={(e) => {
        if (isSubmitting) e.preventDefault();
      }}>
      <div className="modal-box text-white max-w-none sm:max-w-lg max-h-[90dvh] overflow-y-auto overflow-x-clip pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
        {" "}
        {/* Ligeramente más angosto para mejor legibilidad */}
        <form method="dialog" onSubmit={reset}>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            ✕
          </button>
        </form>
        <div className="flex items-center gap-4 mb-2">
          <h3 className="font-semibold text-2xl">{modalMessage.title}</h3>
          <span className="p-2 bg-white text-black rounded-full">
            {isOpenModal.type === "add" ? (
              <IconPlus size={20} />
            ) : (
              <IconEdit size={20} />
            )}
          </span>
        </div>
        <p className="mb-6 text-gray-400">{modalMessage.message}</p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <fieldset disabled={isSubmitting} className="contents">
          {/* Contenedor principal para todos los campos del formulario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* --- CAMPO DNI (SOLO EN MODO AÑADIR) --- */}
            {isOpenModal.type === "add" && (
              <div className="form-control w-full">
                <label className="input input-bordered flex items-center gap-3">
                  <IconEPassport size={20} className="text-gray-400 flex-none" />
                  <input
                    type="text"
                    className="grow"
                    placeholder="DNI"
                    aria-label="DNI"
                    aria-invalid={errors.id ? true : undefined}
                    aria-describedby={errors.id ? "user-id-error" : undefined}
                    {...register("id", {
                      required: "El DNI es requerido",
                      validate: (v) => String(v ?? "").trim().length > 0 || "El DNI es requerido",
                    })}
                  />
                </label>
                {errors.id && (
                  <span id="user-id-error" className="text-error text-xs mt-1 pl-1">
                    {errors.id.message}
                  </span>
                )}
              </div>
            )}

            {/* --- CAMPO ROL --- */}
            <div
              className={`form-control w-full ${
                isOpenModal.type === "edit" ? "sm:col-span-2" : ""
              }`}>
              <select
                defaultValue={selectedUser ? selectedUser.role : ""}
                className="select select-bordered"
                aria-label="Rol"
                aria-invalid={errors.role ? true : undefined}
                aria-describedby={errors.role ? "user-role-error" : undefined}
                {...register("role", { required: "El rol es requerido" })}>
                <option disabled value="">
                  Seleccione un Rol
                </option>
                {Object.values(Roles).map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
              {errors.role && (
                <span id="user-role-error" className="text-error text-xs mt-1 pl-1">
                  {errors.role.message}
                </span>
              )}
            </div>

            {/* --- CAMPO NOMBRE --- */}
            <div className="form-control w-full">
              <label className="input input-bordered flex items-center gap-3">
                <IconUserCircle size={20} className="text-gray-400 flex-none" />
                <input
                  type="text"
                  className="grow"
                  placeholder="Nombre"
                  aria-label="Nombre"
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? "user-name-error" : undefined}
                  {...register("name", {
                    required: "El nombre es requerido",
                    validate: minTrimmed(3, "El nombre", orig(selectedUser?.name)),
                  })}
                />
              </label>
              {errors.name && (
                <span id="user-name-error" className="text-error text-xs mt-1 pl-1">
                  {errors.name.message}
                </span>
              )}
            </div>

            {/* --- CAMPO APELLIDO --- */}
            <div className="form-control w-full">
              <label className="input input-bordered flex items-center gap-3">
                <input
                  type="text"
                  className="grow"
                  placeholder="Apellido"
                  aria-label="Apellido"
                  aria-invalid={errors.lastName ? true : undefined}
                  aria-describedby={errors.lastName ? "user-lastname-error" : undefined}
                  {...register("lastName", {
                    required: "El apellido es requerido",
                    validate: minTrimmed(3, "El apellido", orig(selectedUser?.lastName)),
                  })}
                />
              </label>
              {errors.lastName && (
                <span id="user-lastname-error" className="text-error text-xs mt-1 pl-1">
                  {errors.lastName.message}
                </span>
              )}
            </div>

            {/* --- CAMPO EMAIL (OCUPA TODO EL ANCHO) --- */}
            <div className="form-control w-full sm:col-span-2">
              <label className="input input-bordered flex items-center gap-3">
                <IconMailFilled size={20} className="text-gray-400 flex-none" />
                <input
                  type="email"
                  className="grow"
                  placeholder="Email"
                  aria-label="Email"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "user-email-error" : undefined}
                  {...register("email", {
                    required: "El email es requerido",
                    pattern: {
                      value: /^\S+@\S+\.\S+$/i,
                      message: "Formato de email inválido",
                    },
                    validate: minTrimmed(10, "El email", orig(selectedUser?.email)),
                  })}
                />
              </label>
              {errors.email && (
                <span id="user-email-error" className="text-error text-xs mt-1 pl-1">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* --- CAMPO TELÉFONO --- */}
            <div className="form-control w-full">
              <label className="input input-bordered flex items-center gap-3">
                <IconPhoneFilled size={20} className="text-gray-400 flex-none" />
                <input
                  type="tel"
                  className="grow"
                  placeholder="Teléfono"
                  aria-label="Teléfono"
                  aria-invalid={errors.phone ? true : undefined}
                  aria-describedby={errors.phone ? "user-phone-error" : undefined}
                  {...register("phone", {
                    required: "El teléfono es requerido",
                    validate: minTrimmed(9, "El teléfono", orig(selectedUser?.phone)),
                  })}
                />
              </label>
              {errors.phone && (
                <span id="user-phone-error" className="text-error text-xs mt-1 pl-1">
                  {errors.phone.message}
                </span>
              )}
            </div>

            {/* --- CAMPO USERNAME --- */}
            <div className="form-control w-full">
              <label className="input input-bordered flex items-center gap-3">
                <IconUserFilled size={20} className="text-gray-400 flex-none" />
                <input
                  type="text"
                  className="grow"
                  placeholder="Username"
                  aria-label="Username"
                  aria-invalid={errors.username ? true : undefined}
                  aria-describedby={errors.username ? "user-username-error" : undefined}
                  {...register("username", {
                    required: "El username es requerido",
                    validate: minTrimmed(3, "El username", orig(selectedUser?.username)),
                  })}
                />
              </label>
              {errors.username && (
                <span id="user-username-error" className="text-error text-xs mt-1 pl-1">
                  {errors.username.message}
                </span>
              )}
            </div>

            {/* --- CAMPO CONTRASEÑA --- */}
            <div className="form-control w-full sm:col-span-2">
              <label className="input input-bordered flex items-center gap-3">
                <IconKeyFilled size={20} className="text-gray-400 flex-none" />
                <input
                  type="password"
                  className="grow"
                  placeholder={
                    isOpenModal.type === "edit"
                      ? "Nueva contraseña (opcional)"
                      : "Contraseña"
                  }
                  aria-label="Contraseña"
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={errors.password ? "user-password-error" : undefined}
                  {...register("password", {
                    required:
                      isOpenModal.type === "add"
                        ? "La contraseña es requerida"
                        : false,
                  })}
                />
              </label>
              {errors.password && (
                <span id="user-password-error" className="text-error text-xs mt-1 pl-1">
                  {errors.password.message}
                </span>
              )}
            </div>
          </div>

          {error && (
            <span role="alert" className="text-error text-center">
              {error}
            </span>
          )}

          <LoadingButton
            type="submit"
            loading={isSubmitting}
            loadingText="Guardando…"
            className="btn bg-darkpink hover:bg-darkpink/80 text-white text-base w-full mt-2">
            Guardar
          </LoadingButton>
          </fieldset>
        </form>
      </div>
    </dialog>
  );
}

export default ModalEditAdd;