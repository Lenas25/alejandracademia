"use client";

import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { useEffect, useMemo, useState } from "react";
import { Section } from "@/types/section";
import { IconLayoutGrid, IconPlus, IconSearch } from "@tabler/icons-react";
import { deleteSection, fetchSections } from "@/redux/service/sectionService";
import { fetchCourses } from "@/redux/service/courseService";
import { Roles } from "@/types/roles";
import SectionCard from "./SectionCard";
import SectionForm from "./SectionForm";

export function TableSecciones() {
  const dispatch = useAppDispatch();
  const userLogin = useAppSelector((state) => state.user?.userLogin);
  const sections = useAppSelector((state) => state.section?.sections);
  const sectionStatus = useAppSelector((state) => state.section?.status);
  const courses = useAppSelector((state) => state.course?.courses) || [];

  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [message, setMessage] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");

  useEffect(() => {
    dispatch(fetchSections());
    dispatch(fetchCourses());
  }, [dispatch]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const filteredSections = useMemo(() => {
    return (sections || []).filter((section) => {
      const matchesCourse = courseFilter === "all" || String(section.course?.id) === courseFilter;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = section.name.toLowerCase().includes(searchLower);
      return matchesCourse && matchesSearch;
    });
  }, [sections, courseFilter, searchTerm]);

  const handleCreate = () => {
    setEditingSection(null);
    setShowForm(true);
  };

  const handleEdit = (section: Section) => {
    setEditingSection(section);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingSection(null);
  };

  const handleFormSuccess = (successMessage: string) => {
    setMessage(successMessage);
    setShowForm(false);
    setEditingSection(null);
  };

  const handleDelete = async (section: Section) => {
    const resultAction = await dispatch(deleteSection(section.id));
    if (deleteSection.fulfilled.match(resultAction)) {
      setMessage(resultAction.payload.message);
    }
  };

  return (
    <>
      <div className="flex gap-5 items-center justify-between mb-5 bg-black rounded-lg shadow relative p-4 sm:p-6 md:p-8">
        <div className="flex gap-5 items-center">
          <h1 className="text-2xl font-medium text-white">Secciones</h1>
          <span className="p-2 text-xl flex items-center justify-center bg-white text-black font-medium rounded-full size-10">
            {sections?.length || 0}
          </span>
        </div>
        <IconLayoutGrid size={30} className="text-white" />
      </div>

      {message && (
        <div className={`alert my-5 text-white ${message.includes("Error") ? "alert-error" : "alert-success"}`}>
          {message}
        </div>
      )}

      {showForm ? (
        <SectionForm
          selectedSection={editingSection}
          onCancel={handleCancelForm}
          onSuccess={handleFormSuccess}
        />
      ) : (
        <div className="overflow-x-clip bg-white rounded-lg shadow relative p-3 sm:p-6 md:p-10">
          {userLogin?.role === Roles.ADMIN && (
            <div className="flex flex-col gap-5 mb-5">
              <div className="flex flex-wrap justify-center items-center gap-5 md:justify-end">
                <button
                  type="button"
                  className="btn-ghost btn bg-flamingo text-lg flex-1 h-fit"
                  onClick={handleCreate}>
                  Crear Sección <IconPlus />
                </button>
              </div>
              <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="select select-bordered w-full max-w-xs bg-white text-black">
                  <option value="all">Todos los cursos</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
                <div className="relative w-full">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar sección..."
                    className="input-search"
                  />
                  <IconSearch className="absolute right-3 top-2 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {sectionStatus === "loading" ? (
            <div className="flex justify-center py-10">
              <span className="loading loading-spinner loading-lg text-darkpink" />
            </div>
          ) : filteredSections.length === 0 ? (
            <p className="text-center py-10 text-gray-400">No hay secciones registradas</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSections.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
