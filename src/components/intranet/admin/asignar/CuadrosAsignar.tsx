"use client";

import { Section } from "@/types/section";
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
import TabHeader from "@/components/intranet/admin/secciones/TabHeader";

interface CuadrosAsignarProps {
  selectedSection: Section | null;
}

function CuadrosAsignar({ selectedSection }: CuadrosAsignarProps) {
  const dispatch = useAppDispatch();

  const allEnrollments = useAppSelector(
    (state) => state.enrollment.enrollments,
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
    if (selectedSection?.id) {
      // enrollmentService's `courseId` param name is unchanged: the
      // `/enrollment/course/:id` route path was kept as-is, only its
      // meaning shifted to a section id (see enrollmentService.ts).
      dispatch(fetchEnrollment({ courseId: selectedSection.id }));
    } else {
      setSelectedUsers([]);
      setEnrolledUsersFromBackend([]);
    }
  }, [dispatch, selectedSection?.id]);

  const [enrolledUsersFromBackend, setEnrolledUsersFromBackend] = useState<
    User[]
  >([]);

  useEffect(() => {
    if (!selectedSection) {
      setEnrolledUsersFromBackend([]);
      return;
    }

    const filteredEnrollments = allEnrollments.filter((en) => {
      if (!en.section || !en.active) return false;
      return en.section.id === selectedSection.id;
    });

    const users = filteredEnrollments
      .flatMap((en) => en.user)
      .filter((user): user is User => user != null && "id" in user);

    setEnrolledUsersFromBackend(users);
  }, [allEnrollments, selectedSection]);

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
    const userToRemove = selectedUsers.find(
      (user) => user.id === userIdToRemove,
    );
    if (userToRemove) {
      setSelectedUsers((prev) =>
        prev.filter((user) => user.id !== userIdToRemove),
      );
      setEnrolledUsersFromBackend((prev) =>
        prev.filter((user) => user.id !== userIdToRemove),
      );
    }
  };

  const handleSubmit = async () => {
    if (selectedSection) {
      const enrollmentData = {
        users: selectedUsers.map((user) => ({ id: String(user.id) })),
      };
      const resultAction = await dispatch(
        updateEnrollment({
          courseId: selectedSection.id,
          data: enrollmentData,
        }),
      );
      // Note: `courseId` here is the enrollmentService thunk's param name,
      // unchanged for the same reason as fetchEnrollment above.
      if (updateEnrollment.fulfilled.match(resultAction)) {
        setMessage(
          resultAction.payload.message || "Cambios guardados con éxito",
        );
      }
    }
  };

  const availableUsersToDisplay = useMemo(() => {
    return allUsers.filter((user) => {
      const isStudent = user.role === Roles.ALUMNO;
      const isNotEnrolled = !enrolledUsersFromBackend.some(
        (enrolled) => enrolled.id === user.id,
      );
      const matchesSearch =
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toString().toLowerCase().includes(searchTerm.toLowerCase());

      return isStudent && isNotEnrolled && matchesSearch;
    });
  }, [allUsers, enrolledUsersFromBackend, searchTerm]);

  return (
    <div className="flex flex-col gap-5">
      <TabHeader title="Asignar Estudiantes">
        {selectedSection && (
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-sm bg-darkpink text-white border-none hover:bg-black"
          >
            Guardar
          </button>
        )}
      </TabHeader>

      {!selectedSection ? (
        <div className="flex justify-center items-center py-10">
          <span className="badge badge-outline h-auto text-base py-2 px-4 text-center">
            Seleccione un curso para asignar estudiantes
          </span>
        </div>
      ) : enrollmentStatus === "loading" || userStatus === "loading" ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-lg text-darkpink" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500 break-words">
            {selectedSection.name}
          </p>

          {message && (
            <div
              className={`alert ${
                message.includes("Error") ? "alert-error" : "alert-success"
              } text-white`}
            >
              {message}
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar estudiante..."
              className="input input-bordered w-full bg-white text-black"
            />
            <IconSearch className="absolute right-3 top-2 text-gray-400" />
          </div>

          <div className="flex flex-col gap-4">
            {/* Lista de usuarios DISPONIBLES para agregar */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-500">
                Estudiantes disponibles
              </span>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {availableUsersToDisplay.length > 0 ? (
                  availableUsersToDisplay.map((user) => (
                    <div
                      key={`available-${user.id}`}
                      role="button"
                      tabIndex={0}
                      className="border border-grey rounded-lg p-3 bg-white hover:bg-lightpink/40 transition-colors flex justify-between items-center gap-3 cursor-pointer"
                      onClick={() => handleAddUser(user)}
                    >
                      <span className="min-w-0 break-words text-black">
                        {user.name} {user.lastName} - {user.id}
                      </span>
                      <IconUserPlus className="text-gray-600 shrink-0" />
                    </div>
                  ))
                ) : (
                  <p className="text-center py-10 text-gray-400">
                    No hay estudiantes que coincidan.
                  </p>
                )}
              </div>
            </div>

            {/* Lista de usuarios SELECCIONADOS */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-500">
                Estudiantes asignados ({selectedUsers.length})
              </span>
              <div className="flex flex-col gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={`selected-${user.id}`}
                    className="border border-grey rounded-lg p-3 bg-white hover:bg-lightpink/40 transition-colors flex justify-between items-center gap-3"
                  >
                    <span className="min-w-0 break-words text-black">
                      {user.name} {user.lastName} - {user.id}
                    </span>
                    <button
                      onClick={() => handleRemoveUser(String(user.id))}
                      className="btn btn-ghost btn-sm p-0 min-h-0 h-auto hover:bg-transparent shrink-0"
                    >
                      <IconX className="text-red-500" size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CuadrosAsignar;
