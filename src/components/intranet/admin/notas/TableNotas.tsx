"use client";

import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { Section } from "@/types/section";
import { useEffect, useState } from "react";
import { fetchSections } from "@/redux/service/sectionService";
import { Activity } from "@/types/activity";
import RowCursosHead from "../../RowCursosHead";
import { fetchActivity } from "@/redux/service/activityService";
import { TableStudents } from "./TableStudents";
import { fetchEnrollment } from "@/redux/service/enrollmentService";
import { fetchGrade } from "@/redux/service/gradeService";
import RowStudents from "./RowStudents";

export function TableNotas() {
  const dispatch = useAppDispatch();
  const sections = useAppSelector((state) => state.section.sections);
  const activities = useAppSelector((state) => state.activity.activities) || [];
  const [translate, setTranslate] = useState(0);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"input" | "view">("input");

  const handleSelectSection = (section: Section) => {
    setSelectedActivity(null);
    setSelectedSection(section);
  };

  useEffect(() => {
    dispatch(fetchSections());
  }, [dispatch]);

  useEffect(() => {
    if (selectedSection?.id) {
      dispatch(fetchActivity(selectedSection.id));
      dispatch(fetchEnrollment({ courseId: selectedSection.id }));
    }
  }, [dispatch, selectedSection?.id]);

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
        selectedSection={selectedSection}
        sections={sections}
        handleSelectSection={handleSelectSection}
      />
      <div className="flex flex-col gap-5 bg-white rounded-lg shadow relative p-6 md:p-10">
        <div className="flex flex-col gap-5 w-full md:flex-row md:justify-between items-center">
          <h2 className="text-2xl font-semibold text-center sm:text-left flex-1 max-w-md">
            {viewMode === "input" ? "Calificar Notas" : "Ver Notas"}
          </h2>

          <div className="btn-group gap-3 flex items-center w-full md:max-w-xs ">
            <button
              className={`btn flex-1 ${
                viewMode === "input"
                  ? "bg-flamingo text-white hover:bg-flamingo"
                  : "bg-white text-black hover:bg-flamingo hover:text-white"
              }`}
              type="button"
              onClick={() => setViewMode("input")}>
              Calificar
            </button>
            <button
              className={`btn flex-1 ${
                viewMode === "view"
                  ? "bg-flamingo text-white hover:bg-flamingo"
                  : "bg-white text-black hover:bg-flamingo hover:text-white"
              }`}
              type="button"
              onClick={() => setViewMode("view")}>
              Notas
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 flex-wrap w-full">
          {selectedSection && viewMode === "input" && (
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
                    {activity.name} - {activity.percentage}%
                  </option>
                ))}
            </select>
          )}
        </div>

        {!selectedSection ? (
          <div className="flex justify-center items-center">
            <span className="badge badge-outline h-auto text-base py-2 px-4 text-center">
              Seleccione un curso para{" "}
              {viewMode === "input" ? "calificar" : "ver"} notas
            </span>
          </div>
        ) : viewMode === "input" ? (
          <RowStudents
            selectedSection={selectedSection}
            selectedActivity={selectedActivity}
          />
        ) : (
          <TableStudents />
        )}
      </div>
    </>
  );
}
