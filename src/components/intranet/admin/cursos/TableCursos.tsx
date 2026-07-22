"use client";

import { useAppDispatch, useAppSelector } from "@/redux/stores";
import RowCursos from "./RowCursos";
import { useEffect, useMemo, useState } from "react";
import { Course } from "@/types/course";
import { IconBook, IconPencil, IconPlus, IconSearch } from "@tabler/icons-react";
import { fetchCourses } from "@/redux/service/courseService";
import ModalEditAdd from "./ModalEditAdd";
import { Roles } from "@/types/roles";

export function TableCursos() {
  const dispatch = useAppDispatch();
  const userLogin = useAppSelector((state) => state.user?.userLogin);
  const courses = useAppSelector((state) => state.course?.courses);
  const courseStatus = useAppSelector((state) => state.course?.status);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isOpenModal, setOpenModal] = useState<{
    active: boolean;
    type: string;
  }>({ active: false, type: "" });
  const [message, setMessage] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchCourses());
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
        course.description.toLowerCase().includes(searchLower)
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
                className={`btn-ghost btn text-lg flex-1 h-fit disabled:cursor-not-allowed disabled:opacity-100 disabled:border disabled:border-gray-300 disabled:bg-gray-200 disabled:text-gray-600 ${selectedCourse ? "bg-darkpink" : ""}`}
                onClick={handleModalEdit}
                disabled={!selectedCourse}
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
          <div className="alert alert-success my-5 text-white">{message}</div>
        )}
        <div className="table-scroll size-full">
          <table className="table mb-5 min-w-[560px]">
            <thead className="text-black md:text-lg">
              <tr>
                {userLogin?.role === Roles.ADMIN && <th />}
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Descripcion</th>
              </tr>
            </thead>
            <tbody className="md:text-lg">
              {courseStatus === 'loading' ? (
                <tr>
                  <td colSpan={4} className="text-center py-10">
                    <span className="loading loading-spinner loading-lg text-darkpink" />
                  </td>
                </tr>
              ) : filteredCourses.length === 0 && courseStatus === 'succeeded' ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400">
                    No hay cursos registrados
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                <RowCursos
                  key={course.id}
                  course={course}
                  handleRadioChange={handleRadioChange}
                  selectedCourse={selectedCourse}
                  setMessage={setMessage}
                />
              ))
              )}
            </tbody>
          </table>
        </div>
        {isOpenModal.active && isOpenModal.type === "add" && (
          <ModalEditAdd
            selectedCourse={selectedCourse}
            setMessage={setMessage}
            modalMessage={{
              title: "Agregar Curso",
              message: "Completar para agregar nuevo curso",
            }}
            setSelectedCourse={setSelectedCourse}
            isOpenModal={isOpenModal}
            setOpenModal={setOpenModal}
          />
        )}
        {isOpenModal.active && isOpenModal.type === "edit" && (
          <ModalEditAdd
            selectedCourse={selectedCourse}
            setMessage={setMessage}
            modalMessage={{
              title: "Editar Curso",
              message: "Completa para actualizar",
            }}
            setSelectedCourse={setSelectedCourse}
            isOpenModal={isOpenModal}
            setOpenModal={setOpenModal}
          />
        )}
      </div>
    </>
  );
}
