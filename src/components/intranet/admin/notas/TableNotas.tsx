"use client";

import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { Course } from "@/types/course";
import { useEffect, useState } from "react";
import { fetchCourses } from "@/redux/service/courseService";
import { Activity } from "@/types/activity";
import RowCursosHead from "../../RowCursosHead";
import { fetchActivity } from "@/redux/service/activityService";
import { TableStudents } from "./TableStudents";
import { fetchEnrollment } from "@/redux/service/enrollmentService";
import { fetchGrade } from "@/redux/service/gradeService";
import RowStudents from "./RowStudents";

export function TableNotas() {
  const dispatch = useAppDispatch();
  const courses = useAppSelector((state) => state.course.courses).filter(
    (item) => item.description !== "PROXIMAMENTE"
  );
  const activities = useAppSelector((state) => state.activity.activities) || [];
  const [translate, setTranslate] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"input" | "view">("input");

  const handleSelectCourse = (course: Course) => {
    setSelectedActivity(null);
    setSelectedCourse(course);
  };

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  useEffect(() => {
    if (selectedCourse?.id) {
      dispatch(fetchActivity(selectedCourse.id));
      dispatch(fetchEnrollment({ courseId: selectedCourse.id }));
    }
  }, [dispatch, selectedCourse?.id]);

  useEffect(() => {
    if (selectedActivity?.id && viewMode === "input") {
      dispatch(fetchGrade(selectedActivity.id));
    }
  }, [dispatch, selectedActivity?.id, viewMode]);

  return (
    <>
      <RowCursosHead
        translate={translate}
        setTranslate={setTranslate}
        selectedCourse={selectedCourse}
        courses={courses}
        handleSelectCourse={handleSelectCourse}
      />
      <div className="flex flex-col gap-5 bg-white rounded-lg shadow relative p-6">
        <div className="flex flex-col gap-5 w-full md:flex-row md:justify-between items-center">
          <h2 className="text-2xl font-semisemibold text-center sm:text-left flex-1 max-w-md">
            {viewMode === "input" ? "Calificar Notas" : "Ver Notas"}
          </h2>

          <div className="btn-group gap-3 flex items-center w-full md:max-w-xs ">
            <button
              className={`btn flex-1 ${
                viewMode === "input"
                  ? "bg-flamingo text-white hover:bg-flamingo"
                  : "bg-white text-black hover:bg-flamingo hover:text-white"
              }`}
              onClick={() => setViewMode("input")}>
              Calificar
            </button>
            <button
              className={`btn flex-1 ${
                viewMode === "view"
                  ? "bg-flamingo text-white hover:bg-flamingo"
                  : "bg-white text-black hover:bg-flamingo hover:text-white"
              }`}
              onClick={() => setViewMode("view")}>
              Notas
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 flex-wrap w-full">
          {selectedCourse && viewMode === "input" && (
            <select
              className="select select-bordered bg-white text-black w-full font-sans"
              value={selectedActivity?.id || ""}
              onChange={(e) => {
                const activity = activities.find(
                  (a) => a.id === Number(e.target.value)
                );
                setSelectedActivity(activity || null);
              }}>
              <option value="">Seleccione una actividad</option>
              {activities?.length > 0 &&
                activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name} - {activity.percentage * 100}%
                  </option>
                ))}
            </select>
          )}
        </div>

        {!selectedCourse ? (
          <div className="flex justify-center items-center">
            <span className="badge badge-outline h-auto text-base py-2 px-4 text-center">
              Seleccione un curso para{" "}
              {viewMode === "input" ? "calificar" : "ver"} notas
            </span>
          </div>
        ) : viewMode === "input" ? (
          <RowStudents
            selectedCourse={selectedCourse}
            selectedActivity={selectedActivity}
          />
        ) : (
          <TableStudents />
        )}
      </div>
    </>
  );
}
