"use client";

import { Course } from "@/types/course";
import DragAndDrop from "./DragAndDrop";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import {
  fetchEnrollment,
  updateEnrollment,
} from "@/redux/service/enrollmentService";
import { useEffect, useState } from "react";
import { fetchUsers } from "@/redux/service/userService";
import { Roles } from "@/types/roles";
import { User } from "@/types/user";
import { CreateEnrollment } from "@/types/enrollment";
import { PayloadAction } from "@reduxjs/toolkit";

interface CuadrosAsignarProps {
  selectedCourse: Course | null;
}

function CuadrosAsignar({ selectedCourse }: CuadrosAsignarProps) {
  const dispatch = useAppDispatch();
  const enrollments = useAppSelector(
    (state) => state.enrollment.enrollments
  ).filter(en => en.active).flatMap((enrollment) => enrollment.user);
  const users = useAppSelector((state) => state.user.users)
    .filter((user) => user.role === Roles.ALUMNO)
    .filter(
      (user) => !enrollments.some((enrollment) => enrollment.id === user.id)
    );
  const enrollmentStatus = useAppSelector((state) => state.enrollment.status);
  const userStatus = useAppSelector((state) => state.user.status);

  const [enrollmentResult, setEnrollmentResult] = useState<User[]>([]);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (selectedCourse) {
      dispatch(fetchUsers());
      dispatch(fetchEnrollment({ courseId: selectedCourse.id }));
    }
  }, [dispatch, selectedCourse]);

  const handleEnrollmentChange = (newEnrollment: User[]) => {
    setEnrollmentResult(newEnrollment);
  };

  const handleSubmit = async () => {
    if (selectedCourse) {
      const enrollmentData = {
        users: enrollmentResult.map((enrollment) => ({ id: enrollment.id })),
      };

      const resultAction = (await dispatch(
        updateEnrollment({
          courseId: selectedCourse.id,
          data: enrollmentData,
        })
      )) as PayloadAction<{
        message: string;
        data: CreateEnrollment;
      }>;
      setMessage((resultAction.payload as { message: string }).message);
    }
  };

  return (
    <div className="flex flex-col gap-5 overflow-y-auto bg-white rounded-lg shadow relative p-6 md:p-10">
      <div className="flex flex-wrap gap-5 justify-center w-full md:justify-between">
        <h2 className="text-2xl font-semibold">Asignar Estudiantes</h2>
        <div className="h-[2px] bg-black w-full"/>
      </div>
        {selectedCourse ? (
          <div className="flex gap-5 justify-between w-full flex-col">
            <div className="flex gap-5 justify-between w-full items-center">
              <h3 className="text-xl font-semibold break-words w-[150px] md:w-full">
                {selectedCourse.name}
              </h3>
              <button
                type="button"
                className="btn btn-ghost text-base h-auto bg-yellow"
                onClick={handleSubmit}>
                Guardar
              </button>
            </div>
            {message && (
              <div className="alert alert-danger text-white">
                {message}
              </div>
            )}
            {enrollmentStatus === "loading" || userStatus === "loading" ? (
              <p>Cargando...</p>
            ) : (
              <DragAndDrop
                enrollments={enrollments}
                users={users}
                onEnrollmentChange={handleEnrollmentChange}
              />
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center">
            <span className="badge badge-outline h-auto text-base py-2 px-4 text-center">
            Seleccione un curso para asignar estudiantes
          </span>
          </div>
        )}
    </div>
  );
}

export default CuadrosAsignar;
