"use client";

import { fetchActivity } from "@/redux/service/activityService";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { Activity } from "@/types/activity";
import { Section } from "@/types/section";
import { useEffect } from "react";

interface RowActivitiesProps {
  selectedSection: Section | null;
  selectedActivity: Activity | null;
  setSelectedActivity: (activity: Activity) => void;
  translate2: number;
}

function RowActivities({
  selectedSection,
  selectedActivity,
  setSelectedActivity,
  translate2,
}: RowActivitiesProps) {
  const dispatch = useAppDispatch();
  const activities = useAppSelector((state) => state.activity.activities);
  const activitiesStatus = useAppSelector((state) => state.activity.status);

  useEffect(() => {
    if (selectedSection) {
      dispatch(fetchActivity(selectedSection.id));
    }
  }, [dispatch, selectedSection]);

  if (activitiesStatus === "loading") {
    return <p>Cargando...</p>;
  }

  if (activities.length <= 0) {
    return <p>No hay actividades para calificar</p>;
  }

  return (
   <div className="overflow-hidden w-full"> 
     <div
      className="flex gap-5 py-3 pr-5 md:flex-col md:h-[400px] transition-transform ease-in-out delay-150 md:max-w-[350px] md:overflow-auto"
      style={{ transform: `translateX(${translate2}px)` }}>
      {activities.map((ac) => (
        <button
          key={ac.id}
          type="button"
          className={`btn btn-ghost text-base p-2 rounded-lg w-[200px] md:w-auto flex gap-3 justify-between h-fit text-black flex-col ${
            selectedActivity?.id === ac.id
              ? "bg-white border-2 border-black"
              : "bg-yellow"
          }`}
          onClick={() => setSelectedActivity(ac)}>
          <p className="text-center flex-1">{ac.name}</p>
          <p className="text-center flex-1">{`${(ac.percentage * 100)}%`}</p>
        </button>
      ))}
    </div>
   </div>
  );
}

export default RowActivities;
