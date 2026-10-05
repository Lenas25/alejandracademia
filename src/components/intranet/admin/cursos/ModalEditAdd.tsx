"use client";

import {
  IconBold,
  IconBooks,
  IconEdit,
  IconHelpCircle,
  IconLink,
  IconList,
  IconPlus,
} from "@tabler/icons-react";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/redux/stores";
import { PayloadAction } from "@reduxjs/toolkit";
import { Course, CreateCourse } from "@/types/course";
import { createCourse, updateCourse } from "@/redux/service/courseService";
import { deleteImage, extractImageId, uploadImage } from "@/utils/api";
import { useToast } from "@/components/intranet/ui/Toast";

// Cursos admin manages the catalog `Course` only (name/description/image) —
// tutor, dates, duration, activities and active/finish state moved to
// `Section` (see Secciones admin module, PR4).
interface ModalEditAddProps {
  selectedCourse: Course | null;
  setOpenModal: (isOpen: { active: boolean; type: string }) => void;
  setSelectedCourse: (course: Course | null) => void;
  isOpenModal: { active: boolean; type: string };
  modalMessage: { title: string; message: string };
}

function ModalEditAdd({
  selectedCourse,
  setOpenModal,
  setSelectedCourse,
  isOpenModal,
  modalMessage,
}: ModalEditAddProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Course>({
    defaultValues: selectedCourse
      ? {
          name: selectedCourse.name,
          description: selectedCourse.description,
          imageUrl: selectedCourse.imageUrl,
        }
      : {},
  });

  const dispatch = useAppDispatch();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const { ref: descriptionFieldRef, ...descriptionField } = register("description", {
    required: "Este campo es requerido",
    minLength: {
      value: 3,
      message: "Debe tener al menos 3 caracteres",
    },
  });
  const descriptionErrorId = "course-description-error";
  const nameErrorId = "course-name-error";

  // Applies a markdown transform to the current selection (or cursor
  // position) in the description textarea, then syncs the result back into
  // react-hook-form so validation/dirty state stay correct — the textarea
  // itself is uncontrolled (defaultValue only), so RHF never sees direct DOM
  // mutations unless we push them through setValue.
  const updateDescription = (newValue: string, selectionStart: number, selectionEnd: number) => {
    const textarea = descriptionRef.current;
    if (!textarea) return;
    textarea.value = newValue;
    setValue("description", newValue, { shouldDirty: true, shouldValidate: true });
    textarea.focus();
    textarea.setSelectionRange(selectionStart, selectionEnd);
  };

  const applyBold = () => {
    const textarea = descriptionRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const selected = value.slice(selectionStart, selectionEnd) || "texto";
    const before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);
    const inserted = `**${selected}**`;
    updateDescription(`${before}${inserted}${after}`, selectionStart + 2, selectionStart + 2 + selected.length);
  };

  const applyList = () => {
    const textarea = descriptionRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const nextBreak = value.indexOf("\n", selectionEnd);
    const lineEnd = nextBreak === -1 ? value.length : nextBreak;
    const before = value.slice(0, lineStart);
    const after = value.slice(lineEnd);
    const prefixed = value
      .slice(lineStart, lineEnd)
      .split("\n")
      .map((line) => (line.startsWith("- ") ? line : `- ${line}`))
      .join("\n");
    updateDescription(`${before}${prefixed}${after}`, lineStart, lineStart + prefixed.length);
  };

  const applyLink = () => {
    const textarea = descriptionRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const selected = value.slice(selectionStart, selectionEnd);
    const before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);
    const inserted = selected ? `[${selected}](url)` : `[texto](https://)`;
    updateDescription(`${before}${inserted}${after}`, selectionStart, selectionStart + inserted.length);
  };

  const onSubmit = async (data: Course) => {
    setError(null);
    try {
      let resultAction: PayloadAction<{
        message: string;
        data: CreateCourse | Course;
      }>;
      if (isOpenModal.type === "edit") {
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
        data.imageUrl = response.imageUrl ? response.imageUrl : "";
        resultAction = (await dispatch(createCourse(data))) as PayloadAction<{
          message: string;
          data: CreateCourse;
        }>;
      }
      const payload = resultAction.payload as { message: string; error?: string };
      if (payload?.error) {
        // The thunk fulfills with a Spanish `error`; keep the modal open so
        // the user can fix the data without losing their input.
        setError(payload.error);
        return;
      }
      setSelectedCourse(null);
      toast.success(payload.message);
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
      <div className="modal-box text-white max-w-xl max-h-[90dvh] overflow-y-auto overflow-x-clip">
        <form method="dialog" onSubmit={reset}>
          <button
            type="submit"
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            ✕
          </button>
        </form>
        <div className="flex items-center gap-4 mb-2">
          <h3 className="font-semibold text-2xl">{modalMessage.title}</h3>
          <span className="p-2 bg-white text-black rounded-full">
            {isOpenModal.type === "add" ? <IconPlus /> : <IconEdit />}
          </span>
        </div>
        <p className="mb-6 text-gray-400">{modalMessage.message}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
            <span className="text-center text-lightpink text-sm">
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
                aria-label="Nombre del curso"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? nameErrorId : undefined}
                {...register("name", {
                  required: "Este campo es requerido",
                  validate: (value) =>
                    (value ?? "").trim().length >= 3 || "Debe tener al menos 3 caracteres",
                })}
              />
            </label>
          </div>
          {errors.name && (
            <span id={nameErrorId} className="text-error text-xs mt-1 pl-1">
              {errors?.name?.message}
            </span>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1">
              <div className="tooltip tooltip-bottom" data-tip="Resalta el texto seleccionado en negrita (**texto**)">
                <button
                  type="button"
                  onClick={applyBold}
                  aria-label="Negrita"
                  className="btn btn-sm min-h-10 btn-ghost text-darkpink hover:bg-darkpink hover:text-white">
                  <IconBold size={14} />
                  Negrita
                </button>
              </div>
              <div
                className="tooltip tooltip-bottom"
                data-tip="Convierte las líneas seleccionadas en una lista con viñetas (- item)">
                <button
                  type="button"
                  onClick={applyList}
                  aria-label="Lista"
                  className="btn btn-sm min-h-10 btn-ghost text-darkpink hover:bg-darkpink hover:text-white">
                  <IconList size={14} />
                  Lista
                </button>
              </div>
              <div
                className="tooltip tooltip-bottom"
                data-tip="Inserta un enlace: [texto](https://...)">
                <button
                  type="button"
                  onClick={applyLink}
                  aria-label="Enlace"
                  className="btn btn-sm min-h-10 btn-ghost text-darkpink hover:bg-darkpink hover:text-white">
                  <IconLink size={14} />
                  Enlace
                </button>
              </div>
              <div
                className="tooltip tooltip-bottom"
                data-tip="Seleccioná texto y usá los botones para darle formato. Enter crea un salto de línea.">
                <IconHelpCircle
                  size={16}
                  role="img"
                  aria-label="Ayuda de formato"
                  className="text-gray-400 hover:text-white" />
              </div>
            </div>
            <textarea
              defaultValue={selectedCourse ? selectedCourse.description : ""}
              className="textarea textarea-bordered w-full text-base h-32"
              placeholder="Descripcion"
              aria-label="Descripción del curso"
              aria-invalid={errors.description ? true : undefined}
              aria-describedby={errors.description ? descriptionErrorId : undefined}
              {...descriptionField}
              ref={(element) => {
                descriptionFieldRef(element);
                descriptionRef.current = element;
              }}
            />
            <span className="text-xs text-gray-400">
              Escribí normal y usá los botones para dar formato. Enter = salto de línea. Ej: **negrita**, listas con
              - , enlaces [texto](url).
            </span>
          </div>
          {errors.description && (
            <span id={descriptionErrorId} className="text-error text-xs mt-1 pl-1">
              {errors?.description?.message}
            </span>
          )}
          {error && (
            <span role="alert" className="text-error text-xs mt-1 pl-1">
              {error}
            </span>
          )}
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
