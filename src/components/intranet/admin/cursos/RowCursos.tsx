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

  return (
    <tr>
      {isAdmin && (
        <th>
          <label>
            <input
              type="radio"
              name="courses"
              className="radio border-black"
              value={course.id}
              checked={selectedCourse?.id === course.id}
              onChange={() => handleRadioChange(course)}
            />
          </label>
        </th>
      )}
      <td>
        <div className="size-24 flex justify-center items-center">
          {course.imageUrl !== "" ? (
            <Image
              src={course.imageUrl}
              alt={course.name}
              width={100}
              height={100}
              className="rounded-full object-cover size-full"
            />
          ) : (
            <IconPhotoX size={40} className="text-black" />
          )}
        </div>
      </td>
      <td>
        <div className="flex items-center gap-3">
          <p className="font-semibold break-words">{course.name}</p>
        </div>
      </td>
      <td>
        <p className="overflow-hidden text-ellipsis line-clamp-3 z-10">
          {course.description}
        </p>
      </td>
      {isAdmin && (
        <th>
          <div className="flex flex-col gap-2 justify-center items-stretch">
            <button
              type="button"
              aria-label={`Editar a ${course.name}`}
              className="btn btn-ghost btn-xs bg-flamingo text-black py-2 min-h-10 flex items-center justify-center gap-2 flex-nowrap text-sm md:text-lg w-full h-auto"
              onClick={() => onRequestEdit(course)}>
              <IconPencil />
              Editar
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-xs bg-black text-white py-2 min-h-10 flex items-center justify-center gap-2 flex-nowrap text-sm md:text-lg w-full h-auto hover:text-black"
              onClick={() => onRequestDelete(course)}>
              <IconTrash />
              Eliminar
            </button>
          </div>
        </th>
      )}
    </tr>
  );
}

export default RowCursos;
