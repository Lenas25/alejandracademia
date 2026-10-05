import { User } from "@/types/user";
import { IconHistory, IconPencil, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { useAppSelector } from "@/redux/stores";
import { useToast } from "@/components/intranet/ui/Toast";

interface RowAlumnosProps {
  user: User;
  handleRadioChange: (user: User) => void;
  selectedUser: User | null;
  onRequestDelete: (user: User) => void;
  onRequestEdit: (user: User) => void;
  variant?: "row" | "card";
}

function RowAlumnos({
  user,
  handleRadioChange,
  selectedUser,
  onRequestDelete,
  onRequestEdit,
  variant = "row",
}: RowAlumnosProps) {
  const currentUser = useAppSelector((state) => state.user?.userLogin);
  const toast = useToast();

  let classRole = "bg-black";
  switch (user.role) {
    case "admin":
      classRole = "bg-black";
      break;
    case "tutor":
      classRole = "bg-flamingo";
      break;
    case "alumno":
      classRole = "bg-darkpink";
      break;
  }

  const handleModalDelete = () => {
    if (currentUser?.id === user.id) {
      toast.error("No puedes eliminar tu propia cuenta.");
      return;
    }
    onRequestDelete(user);
  };

  const roleLabel = `${(user.role ?? "")
    .charAt(0)
    .toUpperCase()}${(user.role ?? "").slice(1)}`;
  const fullName = `${user.name ?? ""} ${user.lastName ?? ""}`.trim();

  if (variant === "card") {
    return (
      <div className="rounded-lg border border-grey bg-white p-3 text-black">
        <div className="flex items-start gap-3">
          <input
            type="radio"
            name="users-mobile"
            aria-label={`Seleccionar ${fullName}`}
            className="radio border-black mt-1 shrink-0"
            value={user.id}
            checked={selectedUser?.id === user.id}
            onChange={() => handleRadioChange(user)}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold break-words">{fullName}</span>
              <span
                className={`badge badge-ghost text-white border-none font-semibold ${classRole}`}>
                {roleLabel}
              </span>
            </div>
            <p className="text-sm break-all">{user.email}</p>
            <p className="text-xs text-gray-500 break-all">
              {user.id}
              {user.phone ? ` · ${user.phone}` : ""}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-row flex-wrap gap-2">
          {user.role === "alumno" && (
            <Link
              href={`/intranet/admin/alumnos/${user.id}`}
              className="btn btn-ghost btn-sm min-h-10 bg-darkpink text-white flex items-center justify-center gap-2 flex-nowrap text-sm hover:text-darkpink">
              <IconHistory />
              Historial
            </Link>
          )}
          <button
            type="button"
            aria-label={`Editar a ${fullName}`}
            className="btn btn-ghost btn-sm min-h-10 min-w-10 bg-flamingo text-black flex items-center justify-center"
            onClick={() => onRequestEdit(user)}>
            <IconPencil />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm min-h-10 bg-black text-white flex items-center justify-center gap-2 flex-nowrap text-sm hover:text-black"
            onClick={handleModalDelete}>
            <IconTrash />
            Eliminar
          </button>
        </div>
      </div>
    );
  }

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
      <td className="max-w-[80px] truncate" title={String(user.id)}>
        {user.id}
      </td>
      <td>
        <div className="flex items-center gap-3">
          <div>
            <div className="font-semibold">{user.name}</div>
            <div className="font-semibold">{user.lastName}</div>
          </div>
        </div>
      </td>
      <td className="hidden xl:table-cell">{user.username}</td>
      <td className="max-w-[180px] truncate lg:max-w-none lg:whitespace-normal lg:break-all" title={user.email}>
        {user.email}
      </td>
      <td className="hidden xl:table-cell">{user.phone}</td>
      <td>
        <span
          className={`badge badge-ghost badge-sm text-white p-3 border-none font-semibold text-sm md:text-lg ${classRole}`}>{`${(user.role ?? "")
          .charAt(0)
          .toUpperCase()}${(user.role ?? "").slice(1)}`}</span>
      </td>
      <th>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-label={`Editar a ${fullName}`}
            className="btn btn-ghost btn-xs bg-flamingo text-black py-2 min-h-10 flex items-center justify-center gap-2 flex-nowrap text-sm md:text-lg h-auto"
            onClick={() => onRequestEdit(user)}>
            <IconPencil />
            Editar
          </button>
          {user.role === "alumno" && (
            <Link
              href={`/intranet/admin/alumnos/${user.id}`}
              className="btn btn-ghost btn-xs bg-darkpink text-white py-2 flex items-center justify-center gap-2 flex-nowrap text-sm md:text-lg h-auto hover:text-darkpink">
              <IconHistory />
              Historial
            </Link>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-xs bg-black text-white py-2 flex items-center justify-center gap-2 flex-nowrap text-sm md:text-lg h-auto hover:text-black"
            onClick={handleModalDelete}>
            <IconTrash />
            Eliminar
          </button>
        </div>
      </th>
    </tr>
  );
}

export default RowAlumnos;
