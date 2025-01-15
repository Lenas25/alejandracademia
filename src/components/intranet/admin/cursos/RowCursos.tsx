import {
  IconDeviceDesktopMinus,
  IconPhotoX,
  IconTrash,
} from "@tabler/icons-react";
import ModalDelete from "./ModalDelete";
import ModalEditAdd from "./ModalEditAdd";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { Course } from "@/types/course";
import Image from "next/image";
import { deleteCourse } from "@/redux/service/courseService";
import { Roles } from "@/types/roles";
import { finishEnrollment } from "@/redux/service/enrollmentService";
import { deleteImage, extractImageId } from "@/utils/api";

interface RowCursosProps {
  course: Course;
  handleRadioChange: (course: Course) => void;
  selectedCourse: Course | null;
  setMessage: (message: string) => void;
  isOpenModal: { active: boolean; type: string };
  setOpenModal: (isOpen: { active: boolean; type: string }) => void;
  setSelectedCourse: (course: Course | null) => void;
}

function RowCursos({
  course,
  handleRadioChange,
  selectedCourse,
  setMessage,
  isOpenModal,
  setOpenModal,
  setSelectedCourse,
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
    if (course?.imageUrl !== "") {
      const publicId = course?.imageUrl ? extractImageId(course.imageUrl) : "";
      if (publicId) {
        await deleteImage(publicId);
      }
    }
    if (deleteCourse.fulfilled.match(resultAction)) {
      setMessage(resultAction.payload.message);
    }
    (
      document.getElementById(`delete_${course.id}`) as HTMLDialogElement
    )?.close();
  };

  const handleFinishCourse = async () => {
    if (course.isActive) {
      const resultAction = await dispatch(
        finishEnrollment({ courseId: course.id })
      );
      if (finishEnrollment.fulfilled.match(resultAction)) {
        setMessage(resultAction.payload.message);
      }
    } else {
      setMessage("El curso esta inactivo");
    }
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
          <div>
            <div className="font-bold">{course.name}</div>
          </div>
        </div>
      </td>
      <td>
        <p className="overflow-hidden text-ellipsis line-clamp-3 z-10">
          {course.description}
        </p>
      </td>
      <td>{course?.initialDate.toString()}</td>
      <td>{course?.endDate.toString()}</td>
      <td>
        <span
          className={`badge badge-ghost badge-sm text-white p-3 border-none font-semibold text-sm md:text-lg ${
            course.isActive ? "bg-green-600" : "bg-red-600"
          }`}>
          {course.isActive ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td>
        <ul className="overflow-y-auto h-20 md:h-32">
          {course.activities.map((activity) => (
            <li key={activity.id}>- {activity.name}</li>
          ))}
        </ul>
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
            <button
              type="button"
              className="btn btn-ghost btn-xs bg-black text-white py-2 flex items-center justify-center gap-2 flex-nowrap text-sm md:text-lg w-full h-auto hover:text-black"
              onClick={handleFinishCourse}>
              <IconDeviceDesktopMinus />
              Terminar Curso
            </button>
          </div>
          <ModalDelete handleDelete={handleDelete} info={course.id} />
          {isOpenModal.active && isOpenModal.type === "edit" && (
            <ModalEditAdd
              selectedCourse={selectedCourse}
              setMessage={setMessage}
              setOpenModal={setOpenModal}
              isOpenModal={isOpenModal}
              modalMessage={{
                title: "Editar Usuario",
                message: "Completa para actualizar",
              }}
              setSelectedCourse={setSelectedCourse}
            />
          )}
        </th>
      )}
    </tr>
  );
}

export default RowCursos;
