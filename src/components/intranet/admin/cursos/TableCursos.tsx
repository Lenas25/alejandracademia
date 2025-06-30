"use client";

import { useAppDispatch, useAppSelector } from "@/redux/stores";
import RowCursos from "./RowCursos";
import { useEffect, useState } from "react";
import { Course } from "@/types/course";
import { IconBook, IconPencil, IconPlus } from "@tabler/icons-react";
import { fetchCourses } from "@/redux/service/courseService";
import ModalEditAdd from "./ModalEditAdd";
import { Roles } from "@/types/roles";
import { fetchUsers } from "@/redux/service/userService";

export function TableCursos() {
  const dispatch = useAppDispatch();
  const userLogin = useAppSelector((state) => state.user?.userLogin);
  const courses = useAppSelector((state) => state.course?.courses);
  const users = useAppSelector((state) => state.user?.users).filter(user => user.role === Roles.TUTOR);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isOpenModal, setOpenModal] = useState<{
    active: boolean;
    type: string;
  }>({ active: false, type: "" });
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleRadioChange = (course: Course) => {
    setSelectedCourse(course);
  };

  const handleModalAdd = () => {
    setSelectedCourse(null);
    setOpenModal({ active: true, type: "add" });
  };

  const handleModalEdit = () => {
    if (selectedCourse) {
      setOpenModal({ active: true, type: "edit" });
    }
  };

  return (
    <>
      <div className="flex gap-5 items-center justify-between mb-5 bg-black rounded-lg shadow relative p-6 md:p-8">
        <div className="flex gap-5 items-center">
          <h1 className="text-2xl font-medium text-white">Cursos</h1>
          <span className="p-2 text-xl flex items-center justify-center bg-white text-black font-medium rounded-full size-10">
            {courses?.length || 0}
          </span>
        </div>
        <IconBook size={30} className="text-white" />
      </div>
      <div className="overflow-hidden md:h-[75vh] bg-white rounded-lg shadow relative p-6 md:p-10">
        {userLogin?.role === Roles.ADMIN && (
          <div className="flex flex-wrap justify-center items-center gap-5 mb-5 md:justify-end">
            <button
              type="button"
              className="btn-ghost btn bg-flamingo text-lg flex-1 h-fit"
              onClick={handleModalAdd}>
              Agregar <IconPlus />
            </button>
            <button
              type="button"
              className="btn-ghost btn bg-darkpink text-lg flex-1 h-fit"
              onClick={handleModalEdit}>
              Editar <IconPencil />
            </button>
          </div>
        )}
        {message && (
          <div className="alert alert-danger my-5 text-white ">{message}</div>
        )}
        <div className="overflow-x-auto overflow-y-auto size-full">
          <table className="table mb-5">
            <thead className="text-black md:text-lg">
              <tr>
                {userLogin?.role === Roles.ADMIN && <th />}
                <th>Imagen</th>
                <th>Tutor</th>
                <th>Nombre</th>
                <th>Descripcion</th>
                <th>Dia Inicio</th>
                <th>Dia Final</th>
                <th>Activo</th>
                <th>Actividades</th>
              </tr>
            </thead>
            <tbody className="md:text-lg">
              {courses?.map((course) => (
                <RowCursos
                  key={course.id}
                  users={users}
                  course={course}
                  handleRadioChange={handleRadioChange}
                  selectedCourse={selectedCourse}
                  setMessage={setMessage}
                  isOpenModal={isOpenModal}
                  setOpenModal={setOpenModal}
                  setSelectedCourse={setSelectedCourse}
                />
              ))}
            </tbody>
          </table>
          {isOpenModal.type === "add" && (
            <ModalEditAdd
            users={users}
              selectedCourse={selectedCourse}
              setMessage={setMessage}
              modalMessage={{
                title: "Agregar Curso",
                message:
                  "Completar para agregar nuevo curso con actividades incluidas",
              }}
              setSelectedCourse={setSelectedCourse}
              isOpenModal={isOpenModal}
              setOpenModal={setOpenModal}
            />
          )}
        </div>
      </div>
    </>
  );
}
