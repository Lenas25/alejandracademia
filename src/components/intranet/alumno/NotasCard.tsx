"use client";

import { gradeByEnrollment } from "@/redux/service/gradeService";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { IconListDetails, IconStarsFilled } from "@tabler/icons-react";
import { useEffect } from "react";
import { PASSING_GRADE } from "@/utils/gradeScale";
import { usePagedList } from "../ui/usePagedList";
import { ShowMore } from "../ui/ShowMore";

const PAGE_SIZE = 8;

export function NotasCard() {
  const dispatch = useAppDispatch();
  const enrollmentView = useAppSelector((state) => state.enrollment.enrollmentView);
  const gradesUser = useAppSelector((state) => state.grade.gradesUser);
  const gradeStatus = useAppSelector((state) => state.grade?.status);


  useEffect(() => {
    if (enrollmentView) {
      dispatch(gradeByEnrollment(enrollmentView?.id));
    }
  }, [dispatch, enrollmentView]);

  const { visible, total, shown, remaining, showMore } = usePagedList(
    gradesUser,
    PAGE_SIZE,
    String(enrollmentView?.id ?? ""),
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col h-full overflow-x-clip">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-700">Detalle de Notas</h3>
        <IconListDetails size={24} className="text-gray-400 shrink-0" />
      </div>
      <div className="flex-grow flex flex-col gap-3">
        {gradeStatus === 'loading' ? (
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner text-gray-300"></span>
          </div>
        ) : gradesUser.length > 0 ? (
          visible.map((grade) => {
            const numericGrade = Number(grade.grade);
            const isApproved = numericGrade >= PASSING_GRADE;

            return (
              <div key={grade.id_activity} className="flex justify-between items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-800 break-words">{grade.activity.name}</h4>
                  <p className="text-sm text-gray-500">Peso: {grade.activity.percentage}%</p>
                </div>
                <div 
                  className={`text-lg font-bold text-white w-12 h-12 shrink-0 flex items-center justify-center rounded-full ${isApproved ? 'bg-green-500' : 'bg-red-500'}`}
                >
                  {Math.round(numericGrade)} 
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
            <IconStarsFilled size={40} className="text-gray-200" />
            <div>
              <p className="font-medium text-gray-500">Sin notas registradas</p>
              <p className="text-sm text-gray-400 mt-1">Las notas aparecerán aquí cuando estén disponibles.</p>
            </div>
          </div>
        )}
      </div>
      {gradeStatus !== 'loading' && total > PAGE_SIZE && (
        <ShowMore className="mt-4" shown={shown} total={total} remaining={remaining} onClick={showMore} />
      )}
    </div>
  );
}