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

  useEffect(() => {
    dispatch(setEnrollmentsUser(enrollmentsPerUser[currentCourse]));
  }, [enrollmentsPerUser, dispatch, currentCourse]);

  useEffect(() => {
    dispatch(fetchEnrollmentByUser({ userId: userLogin?.id?.toString() }));
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
    <div className="bg-white rounded-2xl shadow-sm p-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Curso Actual</h3>
        <div className="flex gap-2">
          <button
            onClick={handlePrevCourse}
            className="p-1 text-gray-500 hover:text-black"
            disabled={currentCourse === 0}
          >
            <IconChevronLeft size={20} />
          </button>
          <button
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
            </>
          ) : (
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
