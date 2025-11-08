"use client";

import { useAppDispatch, useAppSelector } from "@/redux/stores";
import RowCursos from "./RowCursos";
import { useEffect, useMemo, useState } from "react";
import { Course } from "@/types/course";
import { IconBook, IconPencil, IconPlus, IconSearch } from "@tabler/icons-react";
import { fetchCourses } from "@/redux/service/courseService";
import ModalEditAdd from "./ModalEditAdd";
import { Roles } from "@/types/roles";
import { fetchUsers } from "@/redux/service/userService";

export function TableCursos() {
  const dispatch = useAppDispatch();
  const userLogin = useAppSelector((state) => state.user?.userLogin);
  const courses = useAppSelector((state) => state.course?.courses);
  const users = useAppSelector((state) => state.user?.users).filter(
    (user) => user.role === Roles.TUTOR
  );
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isOpenModal, setOpenModal] = useState<{
    active: boolean;
    type: string;
  }>({ active: false, type: "" });
  const [message, setMessage] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredCourses = useMemo(() => {
    return (courses || []).filter((course) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        course.name.toLowerCase().includes(searchLower) ||
        course.description.toLowerCase().includes(searchLower) ||
        (typeof course.tutor === "string"
          ? (course.tutor as string).toLowerCase().includes(searchLower)
          : course.tutor && typeof course.tutor === 'object' && 'name' in course.tutor
            ? course.tutor?.name?.toLowerCase().includes(searchLower)
            : false)
      );
    });
  }, [courses, searchTerm]);

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
      <div className="overflow-hidden bg-white rounded-lg shadow relative p-6 md:p-10">
        {userLogin?.role === Roles.ADMIN && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap justify-center items-center gap-5 md:justify-end">
              <button
                type="button"
                className="btn-ghost btn bg-flamingo text-lg flex-1 h-fit"
                onClick={handleModalAdd}
              >
                Agregar <IconPlus />
              </button>
              <button
                type="button"
                className="btn-ghost btn bg-darkpink text-lg flex-1 h-fit"
                onClick={handleModalEdit}
              >
                Editar <IconPencil />
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar curso..."
                className="input-search"
              />
              <IconSearch className="absolute right-3 top-2 text-gray-400" />
            </div>
          </div>
        )}

        {message && (
          <div className="alert alert-danger my-5 text-white">{message}</div>
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
              {filteredCourses.map((course) => (
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
