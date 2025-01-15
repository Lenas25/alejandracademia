"use client";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { Course } from "@/types/course";
import { useEffect, useState } from "react";
import { fetchCourses } from "@/redux/service/courseService";
import RowActivities from "./RowActivities";
import RowStudents from "./RowStudents";
import { Activity } from "@/types/activity";
import Image from "next/image";
import RowCursosHead from "../../RowCursosHead";
import { fetchActivity } from "@/redux/service/activityService";

export function TableNotas() {
  const dispatch = useAppDispatch();
  const courses = useAppSelector((state) => state.course.courses);
  const activities = useAppSelector((state) => state.activity.activities);
  const [translate, setTranslate] = useState(0);
  const [translate2, setTranslate2] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );
  const width = 250;

  const handleLeft = () => {
    if (translate2 < 0) {
      setTranslate2((prev) => prev + width);
    }
  };

  const handleRight = () => {
    if (translate2 > -(activities.length - 1) * width) {
      setTranslate2((prev) => prev - width);
    } else {
      setTranslate2(0);
    }
  };

  const handleSelectCourse = (course: Course) => {
    setSelectedActivity(null);
    setSelectedCourse(course);
  };

  
    useEffect(() => {
      if (selectedCourse) {
        dispatch(fetchActivity(selectedCourse.id));
      }
    }, [dispatch, selectedCourse]);

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
      <div className="flex flex-col gap-5 bg-white rounded-lg shadow relative p-6 md:p-10">
        <div className="flex flex-wrap gap-5 w-full justify-between">
          <h2 className="text-2xl font-semibold">Calificar Notas</h2>
          <div className="flex gap-2 items-center md:hidden">
            <button
              type="button"
              className="bg-black p-2 rounded-full"
              onClick={handleLeft}>
              <IconChevronLeft size={20} className="md:size-7 text-white" />
            </button>
            <button
              type="button"
              className="bg-black p-2 rounded-full text-white"
              onClick={handleRight}>
              <IconChevronRight size={20} className="md:size-7" />
            </button>
          </div>
        </div>
        {selectedCourse ? (
          <div className="flex flex-col gap-5 md:flex-row">
            <RowActivities
              translate2={translate2}
              selectedCourse={selectedCourse}
              selectedActivity={selectedActivity}
              setSelectedActivity={setSelectedActivity}
            />
            <RowStudents
              selectedCourse={selectedCourse}
              selectedActivity={selectedActivity}
            />
          </div>
        ) : (
          <div className="flex justify-center items-center">
            <span className="badge badge-outline h-auto text-base py-2 px-4 text-center">
              Seleccione un curso para calificar notas
            </span>
          </div>
        )}
      </div>
    </>
  );
}
