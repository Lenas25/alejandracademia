"use client";

import { Course } from "@/types/course";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import Image from "next/image";

interface RowCursosProps {
  translate: number;
  setTranslate: React.Dispatch<React.SetStateAction<number>>;
  selectedCourse: Course | null;
  courses: Course[];
  handleSelectCourse: (course: Course) => void;
}

function RowCursosHead({
  translate,
  setTranslate,
  selectedCourse,
  courses,
  handleSelectCourse,
}: RowCursosProps) {
  const width = 200;

  const handleLeft = () => {
    if (translate < 0) {
      setTranslate((prev) => prev + width);
    }
  };

  const handleRight = () => {
    if (translate > -(courses.length - 1) * width) {
      setTranslate((prev) => prev - width);
    } else {
      setTranslate(0);
    }
  };

  return (
    <div className="overflow-hidden flex gap-5 items-center flex-col justify-between mb-5 bg-flamingo rounded-lg shadow relative p-6 md:p-10">
      <div className="flex items-center gap-5 justify-between w-full flex-wrap">
        <h1 className="text-2xl font-semibold text-black">Cursos</h1>
        <div className="flex gap-2 items-center">
          <button
            type="button"
            className="bg-white p-2 rounded-full"
            onClick={handleLeft}>
            <IconChevronLeft size={20} className="md:size-7" />
          </button>
          <button
            type="button"
            className="bg-white p-2 rounded-full"
            onClick={handleRight}>
            <IconChevronRight size={20} className="md:size-7" />
          </button>
        </div>
      </div>
      <div className="overflow-x-hidden w-full">
        <div
          className="flex gap-4 transition-transform ease-in-out delay-150"
          style={{ transform: `translateX(${translate}px)` }}>
          {courses
            .filter((courses) => courses.isActive)
            .map((course) => (
              <button
                key={course.id}
                type="button"
                className={`btn btn-ghost text-base  p-5 rounded-lg h-auto flex flex-col gap-2 flex-none border-2 hover:border-white hover:text-black w-[200px] ${
                  selectedCourse?.id === course.id
                    ? "bg-white text-black"
                    : "bg-black text-white"
                }`}
                onClick={() => handleSelectCourse(course)}>
                {course?.imageUrl ? (
                  <div className="w-20 h-20 relative">
                    <Image
                      src={course.imageUrl}
                      alt={course.name}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-full"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 border-2 border-white rounded-full flex justify-center items-center">
                    <span className="loading loading-ring loading-lg" />
                  </div>
                )}
                <p className="text-center">{course.name}</p>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

export default RowCursosHead;
