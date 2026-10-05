"use client";

import { useEffect, useState, useMemo } from "react";
import RowAlumnos from "./RowAlumnos";
import { User } from "@/types/user";
import {
  IconPencil,
  IconPlus,
  IconSearch,
  IconUsers,
} from "@tabler/icons-react";
import ModalEditAdd from "./ModalEditAdd";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { fetchUsers } from "@/redux/service/userService";
import { fetchCourses } from "@/redux/service/courseService";
import { useDebounce } from "@/hooks/useDebounce";

type RoleFilter = "todos" | "alumno" | "tutor" | "admin";

const ROLE_FILTERS: { key: RoleFilter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "alumno", label: "Alumno" },
  { key: "tutor", label: "Tutor" },
  { key: "admin", label: "Admin" },
];

export function TableAlumnos() {
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.user?.users);
  const userStatus = useAppSelector((state) => state.user?.status);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isOpenModal, setOpenModal] = useState<{
    active: boolean;
    type: string;
  }>({ active: false, type: "" });
  const [message, setMessage] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("todos");
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchCourses());
  }, [dispatch]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((user) => {
      if (roleFilter !== "todos" && user.role !== roleFilter) return false;
      return ["id", "name", "lastName", "email", "phone", "username"].some(
        (field) =>
          String(user[field as keyof typeof user])
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase())
      );
    });
  }, [users, debouncedSearch, roleFilter]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleRadioChange = (user: User) => {
    setSelectedUser(user);
  };

  const handleModalAdd = () => {
    setSelectedUser(null);
    setOpenModal({ active: true, type: "add" });
  };

  const handleModalEdit = () => {
    if (selectedUser) {
      setOpenModal({ active: true, type: "edit" });
    }
  };

  return (
    <>
      <div className="flex gap-5 items-center justify-between mb-5 bg-black rounded-lg shadow relative p-4 sm:p-6 md:p-8">
        <div className="flex gap-5 items-center">
          <h1 className="text-2xl font-medium text-white">Usuarios</h1>
          <span className="p-2 text-xl flex items-center justify-center bg-white text-black font-medium rounded-full size-10">
            {users?.length || 0}
          </span>
        </div>
        <IconUsers size={30} className="text-white" />
      </div>
      <div className="overflow-x-clip bg-white rounded-lg shadow relative p-3 sm:p-6 md:p-10">
        <div className="flex flex-col gap-5">
          {/* `flex-col` guarantees a full-width stack on mobile (not
              wrap-if-it-doesn't-fit) so the pair never overflows the card
              horizontally regardless of label/icon width; `sm:flex-row`
              restores the original side-by-side layout at 640px+. */}
          <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-5 md:justify-end sm:flex-wrap">
            <button
              type="button"
              className="btn-ghost btn bg-flamingo text-lg sm:flex-1 h-fit"
              onClick={handleModalAdd}>
              Agregar <IconPlus />
            </button>
            <button
              type="button"
              className={`btn-ghost btn text-lg sm:flex-1 h-fit disabled:cursor-not-allowed disabled:opacity-100 disabled:border disabled:border-gray-300 disabled:bg-gray-200 disabled:text-gray-600 ${selectedUser ? "bg-darkpink" : ""}`}
              onClick={handleModalEdit}
              disabled={!selectedUser}>
              Editar <IconPencil />
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar usuario..."
              className="input-search"
            />
            <IconSearch className="absolute right-3 top-2 text-gray-400" />
          </div>

          {/* Role filter chips — same pill pattern as CourseSelector. */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
            {ROLE_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setRoleFilter(filter.key)}
                aria-pressed={roleFilter === filter.key}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  roleFilter === filter.key
                    ? "bg-darkpink text-white"
                    : "bg-white text-black border border-grey hover:bg-lightpink"
                }`}>
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className="alert alert-success my-5 text-white">{message}</div>
        )}
        {/* Below md: card list. md and up: table. */}
        <div className="md:hidden flex flex-col gap-3 my-5">
          {userStatus === "loading" ? (
            <div className="text-center py-10">
              <span className="loading loading-spinner loading-lg text-darkpink" />
            </div>
          ) : filteredUsers.length === 0 && userStatus === "succeeded" ? (
            <p className="text-center py-10 text-gray-400">
              No hay usuarios registrados
            </p>
          ) : (
            filteredUsers.map((user) => (
              <RowAlumnos
                key={user.id}
                variant="card"
                user={user}
                handleRadioChange={handleRadioChange}
                selectedUser={selectedUser}
                setMessage={setMessage}
              />
            ))
          )}
        </div>
        <div className="table-scroll size-full hidden md:block">
          <table className="table mb-5 min-w-[640px]">
            <thead className="text-black md:text-lg">
              <tr>
                <th />
                <th>Dni</th>
                <th>Nombre</th>
                <th className="hidden xl:table-cell">Usuario</th>
                <th>Email</th>
                <th className="hidden xl:table-cell">Celular</th>
                <th>Rol</th>
                <th />
              </tr>
            </thead>
            <tbody className="md:text-lg">
              {userStatus === 'loading' ? (
                <tr>
                  <td colSpan={8} className="text-center py-10">
                    <span className="loading loading-spinner loading-lg text-darkpink" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 && userStatus === 'succeeded' ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                <RowAlumnos
                  key={user.id}
                  user={user}
                  handleRadioChange={handleRadioChange}
                  selectedUser={selectedUser}
                  setMessage={setMessage}
                />
              ))
              )}
            </tbody>
          </table>
        </div>
        {isOpenModal.active && isOpenModal.type === "add" && (
          <ModalEditAdd
            modalMessage={{
              title: "Agregar Usuario",
              message: "Completar para agregar nuevo usuario",
            }}
            selectedUser={selectedUser}
            setMessage={setMessage}
            isOpenModal={isOpenModal}
            setOpenModal={setOpenModal}
            setSelectedUser={setSelectedUser}
          />
        )}
        {isOpenModal.active && isOpenModal.type === "edit" && (
          <ModalEditAdd
            modalMessage={{
              title: "Editar Usuario",
              message: "Completa para actualizar",
            }}
            selectedUser={selectedUser}
            setMessage={setMessage}
            isOpenModal={isOpenModal}
            setOpenModal={setOpenModal}
            setSelectedUser={setSelectedUser}
          />
        )}
      </div>
    </>
  );
}
