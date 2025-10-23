"use client";

import { gradeByEnrollment } from "@/redux/service/gradeService";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { IconListDetails, IconStarsFilled } from "@tabler/icons-react";
import { useEffect } from "react";

export function NotasCard() {
  const dispatch = useAppDispatch();
  const enrollmentView = useAppSelector((state) => state.enrollment.enrollmentView);
  const gradesUser = useAppSelector((state) => state.grade.gradesUser);


  useEffect(() => {
    if (enrollmentView) {
      dispatch(gradeByEnrollment(enrollmentView?.id));
    }
  }, [dispatch, enrollmentView]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-700">Detalle de Notas</h3>
        <IconListDetails size={24} className="text-gray-400" />
      </div>
      <div className="flex-grow flex flex-col gap-3 overflow-y-auto pr-2">
        {status === 'loading' ? (
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner text-gray-300"></span>
          </div>
        ) : gradesUser.length > 0 ? (
          gradesUser.map((grade) => {
            const numericGrade = Number(grade.grade);
            const isApproved = numericGrade >= 11;

            return (
              <div key={grade.id_activity} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-800">{grade.activity.name}</h4>
                  <p className="text-sm text-gray-500">Peso: {grade.activity.percentage * 100}%</p>
                </div>
                <div 
                  className={`text-lg font-bold text-white w-12 h-12 flex items-center justify-center rounded-full ${isApproved ? 'bg-green-500' : 'bg-red-500'}`}
                >
                  {Math.round(numericGrade)} 
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <IconStarsFilled size={40} className="mb-2" />
            <p>Aún no hay notas registradas para este curso.</p>
          </div>
        )}
      </div>
    </div>
  );
}