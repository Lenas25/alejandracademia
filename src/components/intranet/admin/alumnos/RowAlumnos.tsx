import { User } from "@/types/user";
import { IconHistory, IconPencil, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { useAppSelector } from "@/redux/stores";
import { useToast } from "@/components/intranet/ui/Toast";

interface RowAlumnosProps {
  user: User;
  onRequestDelete: (user: User) => void;
  onRequestEdit: (user: User) => void;
  variant?: "row" | "card";
}

const cardIconBtn =
  "size-11 min-h-11 p-0 inline-flex items-center justify-center rounded-lg transition-colors";

function RowAlumnos({
  user,
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
  const fullName =
    `${user.name ?? ""} ${user.lastName ?? ""}`.trim() || (user.email ?? user.id);

  if (variant === "card") {
    return (
      <div className="rounded-lg border border-grey bg-white p-3 text-black">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold break-words">{fullName}</span>
              <span
                className={`badge badge-ghost text-white border-none font-semibold ${classRole}`}>
                {roleLabel}
              </span>
            </div>
            <p className="text-sm break-all">{user.email}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
              <span className="min-w-0">
                <span className="font-semibold text-gray-500">DNI </span>
                <span className="break-all tabular-nums">{user.id}</span>
              </span>
              {user.phone && (
                <span className="whitespace-nowrap">
                  <span className="font-semibold text-gray-500">Cel. </span>
                  <span className="tabular-nums">{user.phone}</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-row items-center justify-end gap-2">
          {user.role === "alumno" && (
            <Link
              href={`/intranet/admin/alumnos/${user.id}`}
              title={`Historial de ${fullName}`}
              aria-label={`Historial de ${fullName}`}
              className={`${cardIconBtn} bg-darkpink text-white hover:bg-flamingo hover:text-black`}>
              <IconHistory size={22} />
            </Link>
          )}
          <button
            type="button"
            title={`Editar a ${fullName}`}
            aria-label={`Editar a ${fullName}`}
            className={`${cardIconBtn} bg-flamingo text-black hover:bg-lightpink`}
            onClick={() => onRequestEdit(user)}>
            <IconPencil size={22} />
          </button>
          <button
            type="button"
            title={`Eliminar a ${fullName}`}
            aria-label={`Eliminar a ${fullName}`}
            className={`${cardIconBtn} bg-black text-white hover:bg-darkpink`}
            onClick={handleModalDelete}>
            <IconTrash size={22} />
          </button>
        </div>
      </div>
    );
  }

  const initials =
    `${(user.name ?? "").charAt(0)}${(user.lastName ?? "").charAt(0)}`.toUpperCase() || "?";
  const avatarClass =
    user.role === "tutor" ? "bg-flamingo text-black" : `${classRole} text-white`;

  const iconBtn =
    "btn btn-ghost btn-sm size-10 min-h-10 p-0 flex items-center justify-center";

  return (
    <tr className="text-base transition-colors odd:bg-gray-50/60 hover:bg-lightpink/50">
      <td className="py-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden="true"
            className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarClass}`}>
            {initials}
          </span>
          <div className="min-w-0">
            <div className="font-semibold break-words line-clamp-2">{fullName}</div>
            <div className="text-sm text-gray-500 break-all" title={user.email}>
              {user.email}
            </div>
          </div>
        </div>
      </td>
      <td className="hidden xl:table-cell text-sm tabular-nums font-mono whitespace-nowrap">
        {user.id}
      </td>
      <td className="hidden xl:table-cell text-sm break-all">{user.username}</td>
      <td className="hidden xl:table-cell text-sm tabular-nums whitespace-nowrap">
        {user.phone}
      </td>
      <td>
        <span
          className={`badge badge-sm border-none px-3 py-3 text-xs font-semibold ${
            user.role === "tutor" ? "bg-flamingo text-black" : `${classRole} text-white`
          }`}>
          {roleLabel}
        </span>
      </td>
      <td>
        <div className="flex items-center justify-end gap-1">
          {user.role === "alumno" && (
            <Link
              href={`/intranet/admin/alumnos/${user.id}`}
              title="Historial"
              aria-label={`Historial de ${fullName}`}
              className={`${iconBtn} text-darkpink hover:bg-lightpink`}>
              <IconHistory size={20} />
            </Link>
          )}
          <button
            type="button"
            title="Editar"
            aria-label={`Editar a ${fullName}`}
            className={`${iconBtn} text-black hover:bg-flamingo`}
            onClick={() => onRequestEdit(user)}>
            <IconPencil size={20} />
          </button>
          <button
            type="button"
            title="Eliminar"
            aria-label={`Eliminar a ${fullName}`}
            className={`${iconBtn} text-black hover:bg-black hover:text-white`}
            onClick={handleModalDelete}>
            <IconTrash size={20} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default RowAlumnos;
