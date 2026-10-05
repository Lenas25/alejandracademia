import { IconPencil, IconPhotoX, IconTrash } from "@tabler/icons-react";
import { useAppSelector } from "@/redux/stores";
import { Course } from "@/types/course";
import Image from "next/image";
import { Roles } from "@/types/roles";

interface RowCursosProps {
  course: Course;
  onRequestDelete: (course: Course) => void;
  onRequestEdit: (course: Course) => void;
  variant?: "row" | "card";
}

const cardIconBtn =
  "size-11 min-h-11 p-0 inline-flex items-center justify-center rounded-lg transition-colors";

function RowCursos({
  course,
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
          <div className="mt-3 flex flex-row items-center justify-end gap-2">
            <button
              type="button"
              title={`Editar ${course.name}`}
              aria-label={`Editar ${course.name}`}
              className={`${cardIconBtn} bg-flamingo text-black hover:bg-lightpink`}
              onClick={() => onRequestEdit(course)}>
              <IconPencil size={22} />
            </button>
            <button
              type="button"
              title={`Eliminar ${course.name}`}
              aria-label={`Eliminar ${course.name}`}
              className={`${cardIconBtn} bg-black text-white hover:bg-darkpink`}
              onClick={() => onRequestDelete(course)}>
              <IconTrash size={22} />
            </button>
          </div>
        )}
      </div>
    );
  }

  const iconBtn =
    "btn btn-ghost btn-sm size-10 min-h-10 p-0 flex items-center justify-center";

  return (
    <tr className="text-base transition-colors odd:bg-gray-50/60 hover:bg-lightpink/50">
      <td className="py-3">
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
