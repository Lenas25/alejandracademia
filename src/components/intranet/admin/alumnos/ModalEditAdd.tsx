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

interface ModalEditAddProps {
  selectedUser: User | null;
  setMessage: (message: string) => void;
  setOpenModal: (isOpen: { active: boolean; type: string }) => void;
  setSelectedUser: (user: User | null) => void;
  isOpenModal: { active: boolean; type: string };
  modalMessage: { title: string; message: string };
}

function ModalEditAdd({
  selectedUser,
  setMessage,
  setOpenModal,
  isOpenModal,
  modalMessage,
  setSelectedUser,
}: ModalEditAddProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<User>({
    defaultValues: selectedUser ? { ...selectedUser, password: "" } : {},
  });

  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: User) => {
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
      setSelectedUser(null);
      setMessage((resultAction.payload as { message: string }).message);
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
    <dialog open={isOpenModal.active} className="modal backdrop-blur-sm">
      <div className="modal-box text-white max-w-lg">
        {" "}
        {/* Ligeramente más angosto para mejor legibilidad */}
        <form method="dialog" onSubmit={reset}>
          <button
            type="submit"
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            ✕
          </button>
        </form>
        <div className="flex items-center gap-4 mb-2">
          <h3 className="font-bold text-2xl">{modalMessage.title}</h3>
          <span className="p-2 bg-white text-black rounded-full">
            {isOpenModal.type === "add" ? (
              <IconPlus size={20} />
            ) : (
              <IconEdit size={20} />
            )}
          </span>
        </div>
        <p className="mb-6 text-gray-400">{modalMessage.message}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
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
                    {...register("id", { required: "El DNI es requerido" })}
                  />
                </label>
                {errors.id && (
                  <span className="text-error text-xs mt-1 pl-1">
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
                <span className="text-error text-xs mt-1 pl-1">
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
                  {...register("name", { required: "El nombre es requerido" })}
                />
              </label>
              {errors.name && (
                <span className="text-error text-xs mt-1 pl-1">
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
                  {...register("lastName", {
                    required: "El apellido es requerido",
                  })}
                />
              </label>
              {errors.lastName && (
                <span className="text-error text-xs mt-1 pl-1">
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
                  {...register("email", {
                    required: "El email es requerido",
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: "Formato de email inválido",
                    },
                  })}
                />
              </label>
              {errors.email && (
                <span className="text-error text-xs mt-1 pl-1">
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
                  {...register("phone", {
                    required: "El teléfono es requerido",
                  })}
                />
              </label>
              {errors.phone && (
                <span className="text-error text-xs mt-1 pl-1">
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
                  {...register("username", {
                    required: "El username es requerido",
                  })}
                />
              </label>
              {errors.username && (
                <span className="text-error text-xs mt-1 pl-1">
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
                  {...register("password", {
                    required:
                      isOpenModal.type === "add"
                        ? "La contraseña es requerida"
                        : false,
                  })}
                />
              </label>
              {errors.password && (
                <span className="text-error text-xs mt-1 pl-1">
                  {errors.password.message}
                </span>
              )}
            </div>
          </div>

          {error && <span className="text-error text-center">{error}</span>}

          <button
            type="submit"
            className="btn bg-darkpink hover:bg-darkpink/80 text-white text-base w-full mt-2">
            Guardar
          </button>
        </form>
      </div>
    </dialog>
  );
}

export default ModalEditAdd;
