"use client";

import { useEffect } from "react";
import CourseCard from "./CourseCard";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { fetchCourses } from "@/redux/service/courseService";
import { motion } from "framer-motion";

function CourseCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-white shadow-md">
      <div className="aspect-[4/3] w-full animate-pulse bg-grey" />
      <div className="flex flex-col gap-3 p-5 md:p-6">
        <div className="h-6 w-3/4 animate-pulse rounded bg-grey" />
        <div className="h-4 w-full animate-pulse rounded bg-grey" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-grey" />
      </div>
    </div>
  );
}

export function Courses() {
  const dispatch = useAppDispatch();
  // Public catalog: `isActive` was a Section-level concept and no longer
  // exists on the catalog Course — every catalog entry is shown.
  const courses = useAppSelector((state) => state.course.courses);
  const status = useAppSelector((state) => state.course.status);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1, transition: { duration: 1 } }}
      id="cursos"
      className="my-10 px-3 flex gap-5 items-center flex-col md:px-14 md:py-12 md:gap-10 md:justify-between 2xl:px-32">
      <div className="flex gap-2 justify-center flex-col text-center">
        <div className="flex justify-center">
          <h2 className="text-center text-6xl font-semibold w-auto md:w-[80%] lg:text-8xl">
            Nuestros Cursos
          </h2>
        </div>
        <div className="flex justify-center">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "80%" }}
            transition={{ duration: 2 }}
            className="h-[2px] bg-black lg:h-[4px]"
          />
        </div>
      </div>

      {status === "loading" ? (
        <div className="grid grid-cols-1 gap-8 w-full md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <CourseCardSkeleton key={index} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <p className="text-center text-lg text-black/60 md:text-xl">Muy pronto nuevos cursos</p>
      ) : (
        <div className="grid grid-cols-1 gap-8 w-full md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </motion.section>
  );
}
