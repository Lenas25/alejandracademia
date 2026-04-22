"use client";

import { fetchEnrollmentByUser } from "@/redux/service/enrollmentService";
import { setEnrollmentsUser } from "@/redux/slices/enrollmentSlice";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export function CursoCard() {
  const dispatch = useAppDispatch();
  const enrollmentsPerUser = useAppSelector(
    (state) => state.enrollment.enrollmentsUser
  ).filter((enrollment) => enrollment.active);
  const userLogin = useAppSelector((state) => state.user.userLogin);
  const courses = enrollmentsPerUser.flatMap((enrollment) => enrollment.course);
  const [currentCourse, setCurrentCourse] = useState<number>(0);
  const gradesUser = useAppSelector((state) => state.grade.gradesUser);

  useEffect(() => {
    dispatch(setEnrollmentsUser(enrollmentsPerUser[currentCourse]));
  }, [enrollmentsPerUser, dispatch, currentCourse]);

  useEffect(() => {
    dispatch(fetchEnrollmentByUser({ userId: userLogin?.id?.toString() }));
  }, [dispatch, userLogin?.id]);

  const handlePrevCourse = () => {
    if (currentCourse > 0) {
      dispatch(setEnrollmentsUser(courses[currentCourse - 1]));
      setCurrentCourse((prev) => prev - 1);
    }
  };

  const handleNextCourse = () => {
    if (currentCourse < courses.length - 1) {
      dispatch(setEnrollmentsUser(courses[currentCourse + 1]));
      setCurrentCourse((prev) => prev + 1);
    }
  };

    return (
    <div className="bg-white rounded-2xl shadow-sm p-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Curso Actual</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePrevCourse}
            className="p-1 text-gray-500 hover:text-black"
            disabled={currentCourse === 0}
          >
            <IconChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={handleNextCourse}
            className="p-1 text-gray-500 hover:text-black"
            disabled={currentCourse === courses.length - 1 || courses.length === 0}
          >
            <IconChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="flex-grow flex items-center gap-6 mt-4">
        <div className="w-24 h-24 rounded-full flex-shrink-0">
          <Image
            src={courses[currentCourse]?.imageUrl || "/makeup.webp"}
            alt={courses[currentCourse]?.name || "Curso"}
            width={100}
            height={100}
            className="object-cover w-full h-full rounded-full"
          />
        </div>
        <div className="flex-grow">
          {courses[currentCourse] ? (
            <>
              <h4 className="text-2xl font-bold text-gray-800 mt-1">
                {courses[currentCourse]?.name}
              </h4>
              <p className="text-gray-600 mt-2">
                {courses[currentCourse]?.description}
              </p>

              {/* Barra de progreso de actividades */}
              {(() => {
                const total = courses[currentCourse]?.activities?.length ?? 0;
                const completadas = gradesUser.length;
                if (total === 0) return null;
                const pct = Math.min(Math.round((completadas / total) * 100), 100);
                return (
                  <div className="mt-3">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-darkpink h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {completadas} de {total} actividades completadas
                    </p>
                  </div>
                );
              })()}
            </>
          ) : enrollmentsPerUser.length === 0 ? (
            <div className="space-y-1">
              <p className="text-gray-500 font-medium">Sin cursos activos</p>
              <p className="text-sm text-gray-400">Cuando te matricules en un curso aparecerá aquí.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Cargando curso...</p>
              <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
