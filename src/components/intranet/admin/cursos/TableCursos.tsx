"use client";

import { useAppDispatch, useAppSelector } from "@/redux/stores";
import RowCursos from "./RowCursos";
import { useEffect, useMemo, useState } from "react";
import { Course } from "@/types/course";
import { IconBook, IconPencil, IconPlus, IconSearch } from "@tabler/icons-react";
import { deleteCourse, fetchCourses } from "@/redux/service/courseService";
import ModalEditAdd from "./ModalEditAdd";
import { Roles } from "@/types/roles";
import ModalDelete from "./ModalDelete";
import { deleteImage, extractImageId } from "@/utils/api";
import { ShowMore } from "@/components/intranet/ui/ShowMore";
import { usePagedList } from "@/components/intranet/ui/usePagedList";
import { useToast } from "@/components/intranet/ui/Toast";
import { PageHeader, HeaderPrimaryAction, HeaderSecondaryAction } from "@/components/intranet/ui/PageHeader";

const PAGE_SIZE = 20;

export function TableCursos() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const userLogin = useAppSelector((state) => state.user?.userLogin);
  const courses = useAppSelector((state) => state.course?.courses);
  const courseStatus = useAppSelector((state) => state.course?.status);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isOpenModal, setOpenModal] = useState<{
    active: boolean;
    type: string;
  }>({ active: false, type: "" });
  const [searchTerm, setSearchTerm] = useState("");
  // Single shared delete dialog: the course pending deletion (null = closed).
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  const filteredCourses = useMemo(() => {
    return (courses || []).filter((course) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        course.name.toLowerCase().includes(searchLower) ||
        course.description.toLowerCase().includes(searchLower)
      );
    });
  }, [courses, searchTerm]);

  const { visible, total, shown, remaining, showMore } = usePagedList(
    filteredCourses,
    PAGE_SIZE,
    searchTerm
  );

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

  const handleRequestEdit = (course: Course) => {
    setSelectedCourse(course);
    setOpenModal({ active: true, type: "edit" });
  };

  const handleConfirmDelete = async () => {
    if (deleting || !courseToDelete) return;
    const course = courseToDelete;
    setDeleting(true);
    try {
      const resultAction = await dispatch(deleteCourse(course.id));
      if (deleteCourse.fulfilled.match(resultAction)) {
        const payload = resultAction.payload;
        if ("error" in payload && payload.error) {
          toast.error(payload.error);
        } else {
          if (course.imageUrl) {
            const publicId = extractImageId(course.imageUrl);
            if (publicId) {
              await deleteImage(publicId);
            }
          }
          toast.success(payload.message);
          if (selectedCourse?.id === course.id) setSelectedCourse(null);
        }
      } else {
        toast.error("No se pudo eliminar el curso. Inténtalo de nuevo.");
      }
    } finally {
      setDeleting(false);
    }
    setCourseToDelete(null);
  };

  return (
    <>
      <PageHeader
        icon={<IconBook size={24} />}
        title="Cursos"
        count={courses?.length || 0}
        countLabel={{ singular: "curso", plural: "cursos" }}
        subtitle="Catálogo de cursos de la academia">
        {userLogin?.role === Roles.ADMIN && (
          <>
            <HeaderPrimaryAction onClick={handleModalAdd} icon={<IconPlus size={20} />}>
              Agregar
            </HeaderPrimaryAction>
            <HeaderSecondaryAction
              onClick={handleModalEdit}
              icon={<IconPencil size={20} />}
              disabled={!selectedCourse}
              disabledTitle="Selecciona un elemento para editar">
              Editar
            </HeaderSecondaryAction>
          </>
        )}
      </PageHeader>
      <div className="overflow-x-clip bg-white rounded-lg shadow relative p-3 sm:p-6 md:p-10">
        {userLogin?.role === Roles.ADMIN && (
          <div className="flex flex-col gap-5">
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

        {/* Below md: card list. md and up: table. */}
        <div className="md:hidden flex flex-col gap-3 my-5">
          {courseStatus === "loading" ? (
            <div className="text-center py-10">
              <span className="loading loading-spinner loading-lg text-darkpink" />
            </div>
          ) : filteredCourses.length === 0 && courseStatus === "succeeded" ? (
            <p className="text-center py-10 text-gray-400">No hay cursos registrados</p>
          ) : (
            visible.map((course) => (
              <RowCursos
                key={course.id}
                variant="card"
                course={course}
                handleRadioChange={handleRadioChange}
                selectedCourse={selectedCourse}
                onRequestDelete={setCourseToDelete}
                onRequestEdit={handleRequestEdit}
              />
            ))
          )}
        </div>
        <div className="table-scroll table-scroll-sticky size-full hidden md:block mt-5">
          <table className="table mb-5 w-full">
            <thead className="text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th>Curso</th>
                {userLogin?.role === Roles.ADMIN && (
                  <th className="text-right">
                    <span className="sr-only">Acciones</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {courseStatus === "loading" ? (
                <tr>
                  <td colSpan={2} className="text-center py-10">
                    <span className="loading loading-spinner loading-lg text-darkpink" />
                  </td>
                </tr>
              ) : filteredCourses.length === 0 && courseStatus === "succeeded" ? (
                <tr>
                  <td colSpan={2} className="text-center py-10 text-gray-400">
                    No hay cursos registrados
                  </td>
                </tr>
              ) : (
                visible.map((course) => (
                  <RowCursos
                    key={course.id}
                    course={course}
                    handleRadioChange={handleRadioChange}
                    selectedCourse={selectedCourse}
                    onRequestDelete={setCourseToDelete}
                    onRequestEdit={handleRequestEdit}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        <ShowMore
          shown={shown}
          total={total}
          remaining={remaining}
          onClick={showMore}
          className="mb-5"
        />
        <ModalDelete
          open={courseToDelete !== null}
          onClose={() => {
            if (!deleting) setCourseToDelete(null);
          }}
          handleDelete={handleConfirmDelete}
          pending={deleting}
          name={courseToDelete?.name ?? ""}
        />
        {isOpenModal.active && isOpenModal.type === "add" && (
          <ModalEditAdd
            selectedCourse={selectedCourse}
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
