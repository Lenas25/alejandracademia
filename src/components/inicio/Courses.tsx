"use client";

import { IconChevronRight } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import CourseInfo from "./CourseInfo";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { fetchCourses } from "@/redux/service/courseService";

export function Courses() {
  const dispatch = useAppDispatch();
  const courses = useAppSelector((state) => state.course.courses);
  const [indexVisible, setIndexVisible] = useState(-1);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNextCourse = () => {
    const listCourses = courses.filter((course) => course.isActive).map((course) => course.id);
    const nextIndex = (currentIndex + 1) % listCourses.length;
    setCurrentIndex(nextIndex);
    const element = document.getElementById(`item${listCourses[nextIndex]}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {courses.length > 0 && (
        <section
          id="cursos"
          className="my-10 px-3 flex gap-5 items-center flex-col md:px-14 md:py-12 md:gap-10 md:justify-between 2xl:px-32">
          <div className="flex gap-2 justify-center flex-col text-center">
            <div className="flex justify-center">
              <h2 className="text-center text-6xl font-semibold w-auto md:w-[80%] lg:text-8xl">
                Nuestros Cursos
              </h2>
            </div>
            <div className="flex justify-center">
              <div className="h-[2px] bg-black w-[80%] lg:h-[4px]" />
            </div>
          </div>
          <div className="w-full flex justify-center items-center gap-2 flex-col">
            <div className="carousel carousel-start w-full gap-5">
              {courses
                .filter((course) => course.isActive)
                .map((course) => (
                  <CourseInfo
                    key={course.id}
                    course={course}
                    indexVisible={indexVisible}
                    setIndexVisible={setIndexVisible}
                  />
                ))}
            </div>
            <div className="flex w-full justify-end gap-2">
            <button type="button"
          onClick={handleNextCourse}
          className="btn btn-md text-xl bg-yellow text-black hover:bg-flamingo transition duration-500 ease-in-out border-none"
        >
          <IconChevronRight size={30} />
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
