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
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [viewMode, setViewMode] = useState<'input' | 'view'>('input');

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
    if (selectedActivity?.id && viewMode === 'input') {
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
        <div className="flex flex-wrap gap-5 w-full justify-between items-center">
          <h2 className="text-2xl font-semisemibold">
            {viewMode === 'input' ? 'Calificar Notas' : 'Ver Notas'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="btn-group gap-3 flex items-center flex-1">
              <button
                className={`btn bg-flamingo text-black hover:text-white ${viewMode === 'input' ? 'btn-active' : ''}`}
                onClick={() => setViewMode('input')}
              >
                Calificar
              </button>
              <button
                className={`btn bg-white text-black hover:text-white ${viewMode === 'view' ? 'btn-active' : ''}`}
                onClick={() => setViewMode('view')}
              >
                Ver Notas
              </button>
            </div>
            {selectedCourse && viewMode === 'input' && (
              <select
                className="select select-bordered bg-white text-black w-full max-w-xs font-sans"
                value={selectedActivity?.id || ""}
                onChange={(e) => {
                  const activity = activities.find(
                    (a) => a.id === Number(e.target.value)
                  );
                  setSelectedActivity(activity || null);
                }}
              >
                <option value="">Seleccione una actividad</option>
                {activities?.length > 0 && activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name} - {activity.percentage * 100}%
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        {!selectedCourse ? (
          <div className="flex justify-center items-center">
            <span className="badge badge-outline h-auto text-base py-2 px-4 text-center">
              Seleccione un curso para {viewMode === 'input' ? 'calificar' : 'ver'} notas
            </span>
          </div>
        ) : viewMode === 'input' ? (
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
