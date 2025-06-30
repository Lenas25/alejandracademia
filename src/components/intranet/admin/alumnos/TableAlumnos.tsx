"use client";

import { useEffect, useState } from "react";
import RowAlumnos from "./RowAlumnos";
import { User } from "@/types/user";
import { IconPencil, IconPlus, IconUsers } from "@tabler/icons-react";
import ModalEditAdd from "./ModalEditAdd";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { fetchUsers } from "@/redux/service/userService";
import { fetchCourses } from "@/redux/service/courseService";

export function TableAlumnos() {
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.user?.users);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isOpenModal, setOpenModal] = useState<{
    active: boolean;
    type: string;
  }>({ active: false, type: "" });
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    dispatch(fetchUsers());
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
      <div className="flex gap-5 items-center justify-between mb-5 bg-black rounded-lg shadow relative p-6 md:p-8">
        <div className="flex gap-5 items-center">
          <h1 className="text-2xl font-medium text-white">Usuarios</h1>
          <span className="p-2 text-xl flex items-center justify-center bg-white text-black font-medium rounded-full size-10">
            {users?.length || 0}
          </span>
        </div>
        <IconUsers size={30} className="text-white" />
      </div>
      <div className="overflow-hidden md:h-[75vh] bg-white rounded-lg shadow relative p-6 md:p-10">
        <div className="flex justify-center items-center gap-5 mb-5 md:justify-end">
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
        {message && (
          <div className="alert alert-danger my-5 text-white">{message}</div>
        )}
        <div className="overflow-auto size-full">
          <table className="table mb-5">
            <thead className="text-black md:text-lg">
              <tr>
                <th />
                <th>Dni</th>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Celular</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody className="md:text-lg">
              {users?.map((user) => (
                <RowAlumnos
                  key={user.id}
                  user={user}
                  handleRadioChange={handleRadioChange}
                  selectedUser={selectedUser}
                  setMessage={setMessage}
                  isOpenModal={isOpenModal}
                  setOpenModal={setOpenModal}
                  setSelectedUser={setSelectedUser}
                />
              ))}
            </tbody>
          </table>
          {isOpenModal.type === "add" && (
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
        </div>
      </div>
    </>
  );
}
