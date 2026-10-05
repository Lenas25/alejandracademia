import { IconPencil, IconPhotoX, IconTrash } from "@tabler/icons-react";
import { useAppSelector } from "@/redux/stores";
import { Course } from "@/types/course";
import Image from "next/image";
import { Roles } from "@/types/roles";

interface RowCursosProps {
  course: Course;
  handleRadioChange: (course: Course) => void;
  selectedCourse: Course | null;
  onRequestDelete: (course: Course) => void;
  onRequestEdit: (course: Course) => void;
  variant?: "row" | "card";
}

function RowCursos({
  course,
  handleRadioChange,
  selectedCourse,
  onRequestDelete,
  onRequestEdit,
  variant = "row",
}: RowCursosProps) {
  const userLogin = useAppSelector((state) => state.user?.userLogin);
  const isAdmin = userLogin?.role === Roles.ADMIN;

  if (variant === "card") {
    return (
      <div className="rounded-lg border border-grey bg-white p-3 text-black">
        <div className="flex items-start gap-3">
          {isAdmin && (
            <input
              type="radio"
              name="courses-mobile"
              aria-label={`Seleccionar ${course.name}`}
              className="radio border-black mt-3 shrink-0"
              value={course.id}
              checked={selectedCourse?.id === course.id}
              onChange={() => handleRadioChange(course)}
            />
          )}
          <div className="size-12 shrink-0 flex justify-center items-center">
            {course.imageUrl !== "" ? (
              <Image
                src={course.imageUrl}
                alt={course.name}
                width={48}
                height={48}
                className="rounded-lg object-cover size-full"
              />
            ) : (
              <IconPhotoX size={28} className="text-black" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold break-words line-clamp-2">{course.name}</p>
            <p className="text-sm text-gray-600 break-words line-clamp-3">
              {course.description}
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="mt-3 flex flex-row flex-wrap gap-2">
            <button
              type="button"
              aria-label={`Editar a ${course.name}`}
              className="btn btn-ghost btn-sm min-h-10 min-w-10 bg-flamingo text-black flex items-center justify-center"
              onClick={() => onRequestEdit(course)}>
              <IconPencil />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm min-h-10 bg-black text-white flex items-center justify-center gap-2 flex-nowrap text-sm hover:text-black"
              onClick={() => onRequestDelete(course)}>
              <IconTrash />
              Eliminar
            </button>
          </div>
        )}
      </div>
    );
  }

  const isSelected = selectedCourse?.id === course.id;

  // Row click selects (admin only); clicks on inner buttons must not toggle it.
  const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    if (!isAdmin || (e.target as HTMLElement).closest("a,button")) return;
    handleRadioChange(course);
  };
  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (!isAdmin || e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRadioChange(course);
    }
  };

  const iconBtn =
    "btn btn-ghost btn-sm size-10 min-h-10 p-0 flex items-center justify-center";

  return (
    <tr
      tabIndex={isAdmin ? 0 : undefined}
      aria-current={isAdmin && isSelected ? "true" : undefined}
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      className={`text-base transition-colors odd:bg-gray-50/60 hover:bg-lightpink/50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-darkpink ${
        isAdmin ? "cursor-pointer" : ""
      } ${isSelected && isAdmin ? "!bg-lightpink/70" : ""}`}>
      <td
        className={`py-3 ${isSelected && isAdmin ? "shadow-[inset_3px_0_0_#a16361]" : ""}`}>
        <div className="flex items-center gap-4 min-w-0">
          <div className="size-14 shrink-0 flex items-center justify-center rounded-xl bg-gray-100 overflow-hidden">
            {course.imageUrl !== "" ? (
              <Image
                src={course.imageUrl}
                alt={course.name}
                width={56}
                height={56}
                className="object-cover size-full"
              />
            ) : (
              <IconPhotoX size={28} className="text-gray-500" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold break-words line-clamp-2">{course.name}</p>
            <p className="text-sm text-gray-500 break-words line-clamp-2">
              {course.description}
            </p>
          </div>
        </div>
      </td>
      {isAdmin && (
        <td>
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              title="Editar"
              aria-label={`Editar ${course.name}`}
              className={`${iconBtn} text-black hover:bg-flamingo`}
              onClick={() => onRequestEdit(course)}>
              <IconPencil size={20} />
            </button>
            <button
              type="button"
              title="Eliminar"
              aria-label={`Eliminar ${course.name}`}
              className={`${iconBtn} text-black hover:bg-black hover:text-white`}
              onClick={() => onRequestDelete(course)}>
              <IconTrash size={20} />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

export default RowCursos;
