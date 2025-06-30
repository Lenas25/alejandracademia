"use client";

import { gradeByEnrollment } from "@/redux/service/gradeService";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { IconArrowRight, IconStarsFilled } from "@tabler/icons-react";
import { useEffect } from "react";

export function NotasCard() {
  const dispatch = useAppDispatch();
  const enrollmentView = useAppSelector(
    (state) => state.enrollment.enrollmentView
  );

  const gradesUser = useAppSelector((state) => state.grade.gradesUser);

  useEffect(() => {
    if (enrollmentView) {
      dispatch(gradeByEnrollment(enrollmentView?.id));
    }
  }, [dispatch, enrollmentView]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 flex flex-col gap-5 lg:order-6 lg:p-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl">Notas</h3>
        <IconStarsFilled size={30} />
      </div>
      <div className="flex flex-col gap-5 overflow-y-auto">
        {gradesUser.length > 0 ? (
          gradesUser.map((grade) => (
            <div
              key={grade.id_activity}
              className="flex justify-between items-center">
              <div className="flex gap-5 items-center">
                <h3 className="text-lg font-semisemibold">{grade.activity.name}</h3>
                <span>{grade.activity.percentage *100}%</span>
              </div>
              <IconArrowRight size={30} />
              <span className="text-lg bg-darkpink p-2 size-14 rounded-full flex justify-center items-center text-white font-semisemibold">
                {grade.grade}
              </span>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center gap-5 w-full text-center">
            <span className="loading loading-dots loading-lg" />
            <p>Todavia no hay notas registradas sobre el curso</p>
          </div>
        )}
      </div>
    </div>
  );
}
