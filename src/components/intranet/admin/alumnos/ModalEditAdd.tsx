"use client";

import { Roles } from "@/types/roles";
import { CreateUser, User } from "@/types/user";
import {
  IconEdit,
  IconEPassport,
  IconKeyFilled,
  IconMailFilled,
  IconPhoneFilled,
  IconPlus,
  IconUserCircle,
  IconUserFilled,
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
  setSelectedUser
}: ModalEditAddProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<User>({
    defaultValues: selectedUser
      ? {
          name: selectedUser.name,
          lastName: selectedUser.lastName,
          email: selectedUser.email,
          phone: selectedUser.phone,
          username: selectedUser.username,
          password: "",
          role: selectedUser.role,
        }
      : {},
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
            data.role.toUpperCase() as keyof typeof Roles
          ].toLowerCase(),
          ...(data.password && { password: data.password }),
        };
        resultAction = (await dispatch(
          updateUser({ userId: selectedUser?.id, data: updatedUser })
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
    <dialog
      open={isOpenModal.active}
      id={
        isOpenModal.type === "add"
          ? isOpenModal.type
          : `edit${selectedUser?.id}`
      }
      className="modal backdrop-blur-sm">
      <div className="modal-box text-white max-w-xl">
        <form method="dialog" onSubmit={reset}>
          <button
            type="submit"
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            ✕
          </button>
        </form>
        <div className="flex items-center gap-5">
          <h3 className="font-bold text-2xl">{modalMessage.title}</h3>
          <span className="p-2 bg-white text-black rounded-full">
            {isOpenModal.type === "add" ? <IconPlus /> : <IconEdit />}
          </span>
        </div>
        <p className="py-4 text-base">{modalMessage.message}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex justify-between gap-3 flex-wrap sm:flex-nowrap w-full">
            {isOpenModal.type === "add" && (
              <label className="input input-bordered flex items-center gap-2 w-full">
                <IconEPassport />
                <input
                  defaultValue={selectedUser ? selectedUser.id : ""}
                  type="text"
                  className="grow"
                  placeholder="DNI"
                  {...register("id", {
                    required: "Este campo es requerido",
                    minLength: {
                      value: 3,
                      message: "Debe tener al menos 6 caracteres",
                    },
                  })}
                />
              </label>
            )}
            <select
              defaultValue={selectedUser ? selectedUser.role : ""}
              className="select select-bordered w-full text-base"
              {...register("role", {
                required: "Este campo es requerido",
              })}>
              <option disabled value="">
                Seleccione un Rol
              </option>
              {Object.values(Roles).map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {(errors.id || errors.role) && (
            <span className="pl-1 font-semibold text-red-400">
              {errors?.id?.message || errors.role?.message}
            </span>
          )}
          <div className="flex justify-between gap-3 flex-wrap sm:flex-nowrap">
            <label className="input input-bordered flex items-center gap-2 w-full">
              <IconUserCircle />
              <input
                defaultValue={selectedUser ? selectedUser.name : ""}
                type="text"
                className="grow"
                placeholder="Nombre"
                {...register("name", {
                  required: "Este campo es requerido",
                  minLength: {
                    value: 3,
                    message: "Debe tener al menos 3 caracteres",
                  },
                })}
              />
            </label>
            <label className="input input-bordered flex items-center gap-2 w-full">
              <input
                defaultValue={selectedUser ? selectedUser.lastName : ""}
                type="text"
                className="grow"
                placeholder="Apellido"
                {...register("lastName", {
                  required: "Este campo es requerido",
                  minLength: {
                    value: 3,
                    message: "Debe tener al menos 3 caracteres",
                  },
                })}
              />
            </label>
          </div>
          {(errors.name || errors.lastName) && (
            <span className="pl-1 font-semibold text-red-400">
              {errors?.name?.message || errors.lastName?.message}
            </span>
          )}
          <div className="flex justify-between gap-3 flex-wrap sm:flex-nowrap">
            <label className="input input-bordered flex items-center gap-2 w-full">
              <IconMailFilled />
              <input
                defaultValue={selectedUser ? selectedUser.email : ""}
                type="text"
                className="grow"
                placeholder="Email"
                {...register("email", {
                  required: "Este campo es requerido",
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                    message: "Email inválido",
                  },
                })}
              />
            </label>
            <label className="input input-bordered flex items-center gap-2 w-full">
              <IconPhoneFilled />
              <input
                defaultValue={selectedUser ? selectedUser.phone : ""}
                type="text"
                className="grow"
                placeholder="Telefono"
                {...register("phone", {
                  required: "Este campo es requerido",
                  minLength: {
                    value: 5,
                    message: "Debe tener al menos 10 caracteres",
                  },
                })}
              />
            </label>
          </div>
          {(errors.email || errors.phone) && (
            <span className="pl-1 font-semibold text-red-400">
              {errors?.email?.message || errors.phone?.message}
            </span>
          )}
          <div className="flex justify-between gap-3 flex-wrap sm:flex-nowrap">
            <label className="input input-bordered flex items-center gap-2 w-full">
              <IconUserFilled />
              <input
                defaultValue={selectedUser ? selectedUser.username : ""}
                type="text"
                className="grow"
                placeholder="Username"
                {...register("username", {
                  required: "Este campo es requerido",
                  minLength: {
                    value: 3,
                    message: "Debe tener al menos 3 caracteres",
                  },
                })}
              />
            </label>
            <label className="input input-bordered flex items-center gap-2 w-full">
              <IconKeyFilled />
              <input
                type="password"
                className="grow"
                placeholder="Password"
                {...register("password")}
              />
            </label>
          </div>
          {(errors.username || errors.password) && (
            <span className="pl-1 font-semibold text-red-400">
              {errors?.username?.message || errors.password?.message}
            </span>
          )}
          {error && (
            <span className="pl-1 font-semibold text-red-400">{error}</span>
          )}
          <button
            type="submit"
            className="btn btn-ghost bg-yellow text-black text-base mx-10 my-2">
            Guardar
          </button>
        </form>
      </div>
    </dialog>
  );
}

export default ModalEditAdd;
