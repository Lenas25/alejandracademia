"use client";
import CuadrosAsignar from "./CuadrosAsignar";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { Course } from "@/types/course";
import { useEffect, useState } from "react";
import { fetchCourses } from "@/redux/service/courseService";
import RowCursosHead from "../../RowCursosHead";

export function TableAsignar() {
  const dispatch = useAppDispatch();
  const courses = useAppSelector((state) => state.course.courses).filter(item => item.description !== "PROXIMAMENTE");
  const [translate, setTranslate] = useState<number>(0);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
  };

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  return (
    <>
      <RowCursosHead
        translate={translate}
        setTranslate={setTranslate}
        selectedCourse={selectedCourse}
        courses={courses}
        handleSelectCourse={handleSelectCourse}
      />
      <CuadrosAsignar selectedCourse={selectedCourse} />
    </>
  );
}
