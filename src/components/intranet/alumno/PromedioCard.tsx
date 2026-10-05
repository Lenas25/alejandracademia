"use client";

import { useAppSelector } from "@/redux/stores";
import { calculateWeightedAverage } from "@/utils/gradeAverage";
import { PASSING_GRADE } from "@/utils/gradeScale";
import { IconChartDonut3 } from "@tabler/icons-react";

// Bug fix: this card used to render `enrollmentView.final_grade`, which is
// 0 while a course is active (it's only populated when the course
// finishes) — so every mid-course student saw a false "Desaprobado".
//
// Fix: compute the running average from the student's actual graded
// activities (`calculateWeightedAverage`) and only show a pass/fail
// verdict once the enrollment is finished (`active === false`). While
// active, show the running average with a neutral "En curso" caption and
// no verdict. With nothing graded yet, show a neutral placeholder instead
// of a misleading 0.
export function PromedioCard() {
  const enrollmentView = useAppSelector((state) => state.enrollment.enrollmentView);
  const gradesUser = useAppSelector((state) => state.grade.gradesUser);

  const average = calculateWeightedAverage(gradesUser);
  const isFinished = enrollmentView?.active === false;
  const isApproved = average !== null && average >= PASSING_GRADE;

  const maxGrade = 20;
  const gradePercentage = average === null ? 0 : Math.min((average / maxGrade) * 100, 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (gradePercentage / 100) * circumference;

  // On-palette hero: neutral grey with nothing graded yet, yellow while the
  // course is still in progress, then resolves to darkpink (aprobado) or
  // black (desaprobado) once the course is finished.
  const heroColor =
    average === null ? "text-gray-400" : !isFinished ? "text-yellow" : isApproved ? "text-darkpink" : "text-black";
  const strokeColor =
    average === null
      ? "stroke-gray-300"
      : !isFinished
        ? "stroke-yellow"
        : isApproved
          ? "stroke-darkpink"
          : "stroke-black";

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col h-full overflow-x-clip">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-700">Promedio en curso</h3>
        <IconChartDonut3 size={24} className="text-gray-400 shrink-0" />
      </div>
      <div className="flex-grow flex flex-col justify-center items-center gap-3">
        <div className="relative w-32 h-32 sm:w-40 sm:h-40">
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
            <span className={`text-3xl sm:text-4xl font-bold ${heroColor}`}>
              {average === null ? "—" : average.toFixed(1)}
            </span>
          </div>
        </div>
        {average === null ? (
          <p className="font-medium text-gray-400 text-sm text-center">Sin notas aún</p>
        ) : isFinished ? (
          <p className={`font-semibold text-lg ${isApproved ? "text-darkpink" : "text-black"}`}>
            {isApproved ? "Aprobado" : "Desaprobado"}
          </p>
        ) : (
          <p className="text-sm text-gray-500">En curso</p>
        )}
      </div>
    </div>
  );
}
