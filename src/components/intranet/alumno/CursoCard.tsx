"use client";

import { fetchEnrollmentByUser } from "@/redux/service/enrollmentService";
import { setEnrollmentsUser } from "@/redux/slices/enrollmentSlice";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { Course } from "@/types/course";
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

  useEffect(() => {
    dispatch(setEnrollmentsUser(enrollmentsPerUser[currentCourse]));
  }, [enrollmentsPerUser, dispatch, currentCourse]);

  useEffect(() => {
    dispatch(fetchEnrollmentByUser({ userId: userLogin?.id }));
  }, [dispatch, userLogin?.id]);

  const handlePrevCourse = () => {
    if (currentCourse > 0) {
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
    <div className="bg-white rounded-2xl shadow-lg p-5 flex justify-center flex-col lg:order-3 lg:justify-start lg:pt-[35px]">
      <div className="flex justify-between items-center">
        <h3 className="text-xl">Curso Actual</h3>
        <div className="flex gap-3">
          <button
            type="button"
            className="p-1 bg-gray-200 rounded-full btn btn-ghost min-h-0 h-auto"
            onClick={handlePrevCourse}>
            <IconChevronLeft size={30} />
          </button>
          <button
            type="button"
            className="p-1 bg-gray-200 rounded-full btn btn-ghost min-h-0 h-auto"
            onClick={handleNextCourse}>
            <IconChevronRight size={30} />
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center gap-5">
        <div className="size-36 rounded-full mt-5 lg:size-48">
          <Image
            src={courses[currentCourse]?.imageUrl || "/makeup.jpg"}
            alt={courses[currentCourse]?.name || "Curso"}
            width={200}
            height={200}
            className="object-cover size-full rounded-full"
          />
        </div>
        {courses[currentCourse] ? (
          <h3 className="text-2xl font-semibold text-center lg:text-4xl">
            {courses[currentCourse]?.name}
          </h3>
        ):(
          <span className="loading loading-dots loading-lg" />
        )}
      </div>
    </div>
  );
}
