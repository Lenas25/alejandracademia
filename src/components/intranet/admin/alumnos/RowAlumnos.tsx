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

  const isSelected = selectedUser?.id === user.id;
  const initials =
    `${(user.name ?? "").charAt(0)}${(user.lastName ?? "").charAt(0)}`.toUpperCase() || "?";
  const avatarClass =
    user.role === "tutor" ? "bg-flamingo text-black" : `${classRole} text-white`;

  // Row click selects; clicks on inner buttons/links must not toggle selection.
  const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    if ((e.target as HTMLElement).closest("a,button")) return;
    handleRadioChange(user);
  };
  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRadioChange(user);
    }
  };

  const iconBtn =
    "btn btn-ghost btn-sm size-10 min-h-10 p-0 flex items-center justify-center";

  return (
    <tr
      tabIndex={0}
      aria-current={isSelected ? "true" : undefined}
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      className={`cursor-pointer text-base transition-colors odd:bg-gray-50/60 hover:bg-lightpink/50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-darkpink ${
        isSelected ? "!bg-lightpink/70" : ""
      }`}>
      <td
        className={`py-3 ${isSelected ? "shadow-[inset_3px_0_0_#a16361]" : ""}`}>
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
