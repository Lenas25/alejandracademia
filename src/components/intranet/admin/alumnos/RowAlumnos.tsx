import { User } from "@/types/user";
import { IconTrash } from "@tabler/icons-react";
import ModalDelete from "./ModalDelete";
import ModalEditAdd from "./ModalEditAdd";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { deleteUser } from "@/redux/service/userService";

interface RowAlumnosProps {
  user: User;
  handleRadioChange: (user: User) => void;
  selectedUser: User | null;
  setMessage: (message: string) => void;
  isOpenModal: { active: boolean; type: string };
  setOpenModal: (isOpen: { active: boolean; type: string }) => void;
  setSelectedUser: (user: User | null) => void;
}

function RowAlumnos({
  user,
  handleRadioChange,
  selectedUser,
  setMessage,
  isOpenModal,
  setOpenModal,
  setSelectedUser
}: RowAlumnosProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.user?.userLogin);

  let classRole = "bg-black";
  switch (user.role) {
    case "admin":
      classRole = "bg-black";
      break;
    case "tutor":
      classRole = "bg-yellow";
      break;
    case "alumno":
      classRole = "bg-darkpink";
      break;
  }

  const handleModalDelete = () => {
    if (currentUser?.id !== user.id) {
      (
        document.getElementById(`delete_${user.id}`) as HTMLDialogElement
      )?.showModal();
    }
  };

  const handleDelete = async () => {
    const resultAction = await dispatch(deleteUser(user.id));
    if (deleteUser.fulfilled.match(resultAction)) {
      setMessage(resultAction.payload.message);
    }
    (
      document.getElementById(`delete_${user.id}`) as HTMLDialogElement
    )?.close();
  };

  return (
    <tr>
      <th>
        <label>
          <input
            type="radio"
            name="users"
            className="radio border-black"
            value={user.id}
            checked={selectedUser?.id === user.id}
            onChange={() => handleRadioChange(user)}
          />
        </label>
      </th>
      <td>{user.id}</td>
      <td>
        <div className="flex items-center gap-3">
          <div>
            <div className="font-bold">{user.name}</div>
            <div className="font-bold">{user.lastName}</div>
          </div>
        </div>
      </td>
      <td>{user.username}</td>
      <td>{user.email}</td>
      <td>{user.phone}</td>
      <td>
        <span
          className={`badge badge-ghost badge-sm text-white p-3 border-none font-semibold text-sm md:text-lg ${classRole}`}>{`${user.role
          .charAt(0)
          .toUpperCase()}${user.role.slice(1)}`}</span>
      </td>
      <th>
        <button
          type="button"
          className="btn btn-ghost btn-xs bg-black text-white p-4 flex items-center justify-center gap-5 flex-nowrap text-sm md:text-lg hover:text-black"
          onClick={handleModalDelete}>
          <IconTrash />
          Eliminar
        </button>
        <ModalDelete handleDelete={handleDelete} info={user.id} />
        {isOpenModal.active && isOpenModal.type === "edit" && (
          <ModalEditAdd
            selectedUser={selectedUser}
            setMessage={setMessage}
            setOpenModal={setOpenModal}
            isOpenModal={isOpenModal}
            modalMessage={{
              title: "Editar Usuario",
              message: "Completa para actualizar",
            }}
            setSelectedUser={setSelectedUser}
          />
        )}
      </th>
    </tr>
  );
}

export default RowAlumnos;
