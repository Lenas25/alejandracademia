import { IconPhotoX, IconTrash } from "@tabler/icons-react";
import ModalDelete from "./ModalDelete";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { Course } from "@/types/course";
import Image from "next/image";
import { deleteCourse } from "@/redux/service/courseService";
import { Roles } from "@/types/roles";
import { deleteImage, extractImageId } from "@/utils/api";

interface RowCursosProps {
  course: Course;
  handleRadioChange: (course: Course) => void;
  selectedCourse: Course | null;
  setMessage: (message: string) => void;
}

function RowCursos({
  course,
  handleRadioChange,
  selectedCourse,
  setMessage,
}: RowCursosProps) {
  const dispatch = useAppDispatch();
  const userLogin = useAppSelector((state) => state.user?.userLogin);
  const handleModalDelete = () => {
    (
      document.getElementById(`delete_${course.id}`) as HTMLDialogElement
    )?.showModal();
  };

  const handleDelete = async () => {
    const resultAction = await dispatch(deleteCourse(course.id));
    if (deleteCourse.fulfilled.match(resultAction)) {
      const payload = resultAction.payload;
      if ("error" in payload && payload.error) {
        setMessage(`Error al eliminar el curso: ${payload.error}`);
      } else {
        if (course?.imageUrl !== "") {
          const publicId = course?.imageUrl ? extractImageId(course.imageUrl) : "";
          if (publicId) {
            await deleteImage(publicId);
          }
        }
        setMessage(payload.message);
      }
    }
    (
      document.getElementById(`delete_${course.id}`) as HTMLDialogElement
    )?.close();
  };

  return (
    <tr>
      {userLogin?.role === Roles.ADMIN && (
        <th>
          <label>
            <input
              type="radio"
              name="users"
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
            <p className="font-semibold">{course.name}</p>
        </div>
      </td>
      <td>
        <p className="overflow-hidden text-ellipsis line-clamp-3 z-10">
          {course.description}
        </p>
      </td>
      {userLogin?.role === Roles.ADMIN && (
        <th>
          <div className="flex gap-2 flex-wrap justify-center items-center">
            <button
              type="button"
              className="btn btn-ghost btn-xs bg-black text-white py-2 flex items-center justify-center gap-2  flex-nowrap text-sm md:text-lg w-full h-auto hover:text-black"
              onClick={handleModalDelete}>
              <IconTrash />
              Eliminar
            </button>
          </div>
          <ModalDelete handleDelete={handleDelete} info={course.id} name={course.name} />
        </th>
      )}
    </tr>
  );
}

export default RowCursos;
