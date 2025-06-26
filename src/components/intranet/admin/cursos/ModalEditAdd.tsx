"use client";

import { IconBooks, IconEdit, IconPlus } from "@tabler/icons-react";
import React, { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useAppDispatch } from "@/redux/stores";
import { PayloadAction } from "@reduxjs/toolkit";
import { Course, CreateCourse } from "@/types/course";
import { createCourse, updateCourse } from "@/redux/service/courseService";
import { deleteImage, extractImageId, uploadImage } from "@/utils/api";
import { User } from "@/types/user";

interface ModalEditAddProps {
  selectedCourse: Course | null;
  setMessage: (message: string) => void;
  setOpenModal: (isOpen: { active: boolean; type: string }) => void;
  setSelectedCourse: (course: Course | null) => void;
  isOpenModal: { active: boolean; type: string };
  modalMessage: { title: string; message: string };
  users: User[];
}

function ModalEditAdd({
  users,
  selectedCourse,
  setMessage,
  setOpenModal,
  setSelectedCourse,
  isOpenModal,
  modalMessage,
}: ModalEditAddProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Course>({
    defaultValues: selectedCourse ? selectedCourse: {},
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "activities",
  });

  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const calculateDurationInMonths = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    return months === 0 ? 1 : months;
  };

  const onSubmit = async (data: Course) => {
    try {
      let resultAction: PayloadAction<{
        message: string;
        data: CreateCourse | Course;
      }>;
      data.activities = data.activities.map(({ percentage, ...activity }) => ({
        ...activity,
        percentage: Number.parseFloat(Number(percentage).toFixed(2)),
      }));
      data.duration = calculateDurationInMonths(
        new Date(data.initialDate),
        new Date(data.endDate)
      );
      // biome-ignore lint/performance/noDelete: <explanation>
      delete data.tutor;
      if (isOpenModal.type === "edit") {
        data.isActive = String(data.isActive) === "true";
        if (selectedCourse?.imageUrl !== "" && file) {
          const publicId = selectedCourse?.imageUrl
            ? extractImageId(selectedCourse.imageUrl)
            : "";
          if (publicId) {
            await deleteImage(publicId);
          }
        }
        const response = file ? await uploadImage(file) : "";
        data.imageUrl = response.imageUrl
          ? response.imageUrl
          : selectedCourse?.imageUrl;
        resultAction = (await dispatch(
          updateCourse({ courseId: selectedCourse?.id, data })
        )) as PayloadAction<{ message: string; data: Course }>;
      } else {
        const response = file ? await uploadImage(file) : "";
        data.imageUrl = response.imageUrl ? response.imageUrl : selectedCourse;
        resultAction = (await dispatch(createCourse(data))) as PayloadAction<{
          message: string;
          data: CreateCourse;
        }>;
      }
      setSelectedCourse(null);
      setMessage((resultAction.payload as { message: string }).message);
      setOpenModal({ active: false, type: "" });
    } catch (error) {
      console.error(error);
      setError("Error al guardar el curso");
    }
  };

  const reset = () => {
    setSelectedCourse(null);
    setOpenModal({ active: false, type: "" });
  };

  return (
    <dialog
      open={isOpenModal.active}
      id={
        isOpenModal.type === "add"
          ? isOpenModal.type
          : `edit${selectedCourse?.id}`
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
          <div className="flex justify-between gap-3 flex-wrap sm:flex-nowrap">
            <select
              defaultValue = {selectedCourse?.tutor?.id || "" }
              className="select select-bordered w-full text-base"
              {...register("id_tutor", {
                required: "Este campo es requerido"
              })}>
              <option disabled value="">
                Seleccione un Tutor
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.lastName}
                </option>
              ))}
            </select>

            {selectedCourse && (
              <div className="w-full flex justify-center sm:justify-end">
                <select
                  defaultValue={selectedCourse?.isActive ? "true" : "false"}
                  className="select select-bordered w-full max-w-xs text-base"
                  {...register("isActive", {
                    required: "Este campo es requerido",
                  })}>
                  <option disabled value="">
                    Seleccione un Estado
                  </option>
                  <option value="true">Activado</option>
                  <option value="false">Desactivado</option>
                </select>
              </div>
            )}
          </div>
          <input
            type="file"
            className="file-input file-input-bordered w-full"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setFile(e.target.files[0]);
              }
            }}
          />
          {selectedCourse && selectedCourse?.imageUrl !== "" && (
            <span className="text-center text-yellow">
              Ya existe una imagen cargada, puedes subir una nueva para
              reemplazarla
            </span>
          )}
          <div className="flex justify-between gap-3 flex-wrap sm:flex-nowrap">
            <label className="input input-bordered flex items-center gap-2 w-full">
              <IconBooks />
              <input
                defaultValue={selectedCourse ? selectedCourse.name : ""}
                type="text"
                className="grow"
                placeholder="Nombre Curso"
                {...register("name", {
                  required: "Este campo es requerido",
                  minLength: {
                    value: 3,
                    message: "Debe tener al menos 3 caracteres",
                  },
                })}
              />
            </label>
          </div>
          {errors.name && (
            <span className="pl-1 font-semibold text-red-400">
              {errors?.name?.message}
            </span>
          )}
          <div className="flex justify-between gap-3 flex-wrap sm:flex-nowrap">
            <textarea
              defaultValue={selectedCourse ? selectedCourse.description : ""}
              className="textarea textarea-bordered w-full text-base h-32"
              placeholder="Descripcion"
              {...register("description", {
                required: "Este campo es requerido",
                minLength: {
                  value: 3,
                  message: "Debe tener al menos 3 caracteres",
                },
              })}
            />
          </div>
          {errors.description && (
            <span className="pl-1 font-semibold text-red-400">
              {errors?.description?.message}
            </span>
          )}
          <div className="flex justify-between gap-3 flex-wrap sm:flex-nowrap">
            <label className="input input-bordered flex items-center gap-2 w-full">
              <div className="label">
                <span className="label-text text-base">Dia Inicio</span>
              </div>
              <input
                defaultValue={selectedCourse?.initialDate.toString()}
                type="date"
                className="grow"
                {...register("initialDate", {
                  required: "Este campo es requerido",
                })}
              />
            </label>
            <label className="input input-bordered flex items-center gap-2 w-full">
              <div className="label">
                <span className="label-text text-base">Dia Final</span>
              </div>
              <input
                defaultValue={selectedCourse?.initialDate.toString()}
                type="date"
                className="grow"
                {...register("endDate", {
                  required: "Este campo es requerido",
                })}
              />
            </label>
          </div>
          {(errors.initialDate || errors.endDate) && (
            <span className="pl-1 font-semibold text-red-400">
              {errors?.initialDate?.message || errors.endDate?.message}
            </span>
          )}
          <div className="mt-4">
            <div className="flex gap-3 flex-wrap justify-between items-center">
              <h4 className="font-bold text-xl">Actividades</h4>
              <button
                type="button"
                onClick={() => append({ name: "", percentage: 0, new: true })}
                className="btn btn-sm btn-primary bg-darkpink border-none text-white text-base">
                Agregar
              </button>
            </div>
            <ul className="list-disc list-inside flex gap-2 flex-col mt-4">
              {fields.map((field, index) => (
                <li key={field.id} className="flex gap-2 items-end">
                  <label className="form-control w-full max-w-xs">
                    <div className="label">
                      <span className="label-text">Nombre</span>
                    </div>
                    <input
                      type="text"
                      {...register(`activities.${index}.name`, {
                        required: "Este campo es requerido",
                      })}
                      className="input input-bordered w-full"
                    />
                  </label>

                  <label className="form-control w-full max-w-xs">
                    <div className="label">
                      <span className="label-text">Porcentaje %</span>
                    </div>
                    <input
                      type="number"
                      max={1}
                      min={0}
                      step={0.01}
                      placeholder="ej%. 0,10"
                      {...register(`activities.${index}.percentage`, {
                        required: "Este campo es requerido",
                      })}
                      className="input input-bordered w-24"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="btn btn-sm btn-error mb-3">
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          </div>
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
