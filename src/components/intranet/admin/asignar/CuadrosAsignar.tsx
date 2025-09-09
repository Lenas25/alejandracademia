"use client";

import { Course } from "@/types/course";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import {
  fetchEnrollment,
  updateEnrollment,
} from "@/redux/service/enrollmentService";
import { useEffect, useMemo, useState } from "react";
import { fetchUsers } from "@/redux/service/userService";
import { Roles } from "@/types/roles";
import { User } from "@/types/user";
import { IconUserPlus, IconX, IconSearch } from "@tabler/icons-react";

interface CuadrosAsignarProps {
  selectedCourse: Course | null;
}

function CuadrosAsignar({ selectedCourse }: CuadrosAsignarProps) {
  const dispatch = useAppDispatch();

  const allEnrollments = useAppSelector(
    (state) => state.enrollment.enrollments
  );
  const allUsers = useAppSelector((state) => state.user.users);
  const enrollmentStatus = useAppSelector((state) => state.enrollment.status);
  const userStatus = useAppSelector((state) => state.user.status);

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [message, setMessage] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (selectedCourse?.id) {
      dispatch(fetchEnrollment({ courseId: selectedCourse.id }));
    } else {
      setSelectedUsers([]);
      setEnrolledUsersFromBackend([]);
    }
  }, [dispatch, selectedCourse?.id]);

  const [enrolledUsersFromBackend, setEnrolledUsersFromBackend] = useState<User[]>([]);

  useEffect(() => {
    if (!selectedCourse) {
      setEnrolledUsersFromBackend([]);
      return;
    }

    const filteredEnrollments = allEnrollments.filter((en) => {
      if (!en.course || !en.active) return false;

      const course = en.course as Course | Course[];
      if (Array.isArray(course)) {
        return course.some((c) => c.id === selectedCourse.id);
      }
      return course.id === selectedCourse.id;
    });

    const users = filteredEnrollments
      .flatMap((en) => en.user)
      .filter((user): user is User => user != null && "id" in user);
    
    setEnrolledUsersFromBackend(users);
  }, [allEnrollments, selectedCourse]);

  useEffect(() => {
    setSelectedUsers(enrolledUsersFromBackend);
  }, [enrolledUsersFromBackend]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleAddUser = (userToAdd: User) => {
    if (!selectedUsers.some((user) => user.id === userToAdd.id)) {
      setSelectedUsers((prev) => [...prev, userToAdd]);
      setEnrolledUsersFromBackend((prev) => [...prev, userToAdd]);
    }
  };

  const handleRemoveUser = (userIdToRemove: string) => {
    const userToRemove = selectedUsers.find(user => user.id === userIdToRemove);
    if (userToRemove) {
      setSelectedUsers((prev) => prev.filter((user) => user.id !== userIdToRemove));
      setEnrolledUsersFromBackend((prev) => prev.filter((user) => user.id !== userIdToRemove));
    }
  };

  const handleSubmit = async () => {
    if (selectedCourse) {
      const enrollmentData = {
        users: selectedUsers.map((user) => ({ id: String(user.id) })),
      };
      const resultAction = await dispatch(
        updateEnrollment({ courseId: selectedCourse.id, data: enrollmentData })
      );
      if (updateEnrollment.fulfilled.match(resultAction)) {
        setMessage(
          resultAction.payload.message || "Cambios guardados con éxito"
        );
      }
    }
  };

  const availableUsersToDisplay = useMemo(() => {
    return allUsers.filter((user) => {
      const isStudent = user.role === Roles.ALUMNO;
      const isNotEnrolled = !enrolledUsersFromBackend.some(
        (enrolled) => enrolled.id === user.id
      );
      const matchesSearch =
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toString().toLowerCase().includes(searchTerm.toLowerCase());

      return isStudent && isNotEnrolled && matchesSearch;
    });
  }, [allUsers, enrolledUsersFromBackend, searchTerm]);

  return (
    <div className="flex flex-col gap-5 overflow-y-auto bg-white rounded-lg shadow relative p-6">
      <div className="flex flex-wrap gap-5 justify-center w-full md:justify-between">
        <h2 className="text-2xl font-medium">Asignar Estudiantes</h2>
        <div className="h-[2px] bg-black w-full" />
      </div>

      {!selectedCourse ? (
        <div className="flex justify-center items-center">
          <span className="badge badge-outline h-auto text-base py-2 px-4 text-center">
            Seleccione un curso para asignar estudiantes
          </span>
        </div>
      ) : enrollmentStatus === "loading" || userStatus === "loading" ? (
        <p>Cargando...</p>
      ) : (
        <div className="flex gap-5 justify-between w-full flex-col">
          <h3 className="text-xl font-medium break-words w-full">
            {selectedCourse.name}
          </h3>

          {message && (
            <div
              className={`alert ${
                message.includes("Error") ? "alert-error" : "alert-success"
              } text-white`}>
              {message}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-5 flex-wrap">
              <div className="relative flex-1 min-w-[250px]">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar estudiante para agregar..."
                  className="input-search"
                />
                <IconSearch className="absolute right-3 top-2 text-gray-400" />
              </div>
              <button
                type="button"
                className="btn btn-ghost text-base h-auto bg-flamingo font-medium mb-3 w-full md:w-auto"
                onClick={handleSubmit}>
                Guardar
              </button>
            </div>

            {/* Lista de usuarios DISPONIBLES para agregar */}
            <h4 className="text-lg font-medium mb-2">
              Estudiantes disponibles
            </h4>
            <ul className="max-h-60 overflow-y-auto border rounded-lg divide-y">
              {availableUsersToDisplay.length > 0 ? (
                availableUsersToDisplay.map((user) => (
                  <li
                    key={`available-${user.id}`}
                    className="p-3 hover:bg-gray-100 flex justify-between items-center cursor-pointer"
                    onClick={() => handleAddUser(user)}>
                    <span>
                      {user.name} {user.lastName} - {user.id}
                    </span>
                    <IconUserPlus className="text-gray-600" />
                  </li>
                ))
              ) : (
                <li className="p-3 text-gray-500">
                  No hay estudiantes que coincidan.
                </li>
              )}
            </ul>

            {/* Lista de usuarios SELECCIONADOS */}
            <div className="mt-4">
              <h4 className="text-lg font-medium mb-2">
                Estudiantes asignados ({selectedUsers.length})
              </h4>
              <ul className="space-y-2">
                {selectedUsers.map((user) => (
                  <li
                    key={`selected-${user.id}`}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span>
                      {user.name} {user.lastName} - {user.id}
                    </span>
                    <button
                      onClick={() => handleRemoveUser(String(user.id))}
                      className="btn btn-ghost btn-sm p-0 min-h-0 h-auto hover:bg-transparent">
                      <IconX className="text-red-500" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CuadrosAsignar;
