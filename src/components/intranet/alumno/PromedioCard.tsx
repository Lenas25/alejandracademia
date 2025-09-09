"use client";

import { useAppSelector } from "@/redux/stores";
import { IconChartDonut3 } from "@tabler/icons-react";

export function PromedioCard() {
  const enrollmentView = useAppSelector((state) => state.enrollment.enrollmentView);
  const finalGrade = Number(enrollmentView?.final_grade || "0");
  
  const maxGrade = 20; 
  const gradePercentage = (finalGrade / maxGrade) * 100;
  const circumference = 2 * Math.PI * 45; 
  const strokeDashoffset = circumference - (gradePercentage / 100) * circumference;

  const gradeColor = finalGrade >= 15 ? "text-green-500" : finalGrade >= 11 ? "text-yellow-500" : "text-red-500";
  const strokeColor = finalGrade >= 15 ? "stroke-green-500" : finalGrade >= 11 ? "stroke-yellow-500" : "stroke-red-500";

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-700">Promedio General</h3>
        <IconChartDonut3 size={24} className="text-gray-400" />
      </div>
      <div className="flex-grow flex flex-col justify-center items-center gap-4">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Círculo de fondo */}
            <circle className="stroke-current text-gray-200" strokeWidth="10" cx="50" cy="50" r="45" fill="transparent" />
            {/* Círculo de progreso */}
            <circle
              className={`transform -rotate-90 origin-center transition-all duration-1000 ${strokeColor}`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-4xl font-bold ${gradeColor}`}>
              {finalGrade.toFixed(1)}
            </span>
          </div>
        </div>
        {enrollmentView && (
          <p className={`font-semibold text-lg ${gradeColor}`}>
            {finalGrade >= 11 ? "Aprobado" : "Desaprobado"}
          </p>
        )}
      </div>
    </div>
  );
}