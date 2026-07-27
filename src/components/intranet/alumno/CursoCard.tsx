"use client";

import { fetchActivity } from "@/redux/service/activityService";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import Image from "next/image";
import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

// Selected-course header/hero. The course selector (chevrons that used to
// live here) moved out to `CourseSelector.tsx`, which is the single source
// of truth for which enrollment is selected — this card just renders it.
//
// Bug fix: the old chevrons dispatched a `Section` into `enrollmentView`
// (a slot typed for `Enrollment`) whenever the student paged between
// courses. `CourseSelector` dispatches the correct `Enrollment` object, so
// that mismatch is gone along with the chevrons themselves.
export function CursoCard() {
  const dispatch = useAppDispatch();
  const enrollmentView = useAppSelector((state) => state.enrollment.enrollmentView);
  const enrollmentStatus = useAppSelector((state) => state.enrollment.status);
  const gradesUser = useAppSelector((state) => state.grade.gradesUser);
  const activities = useAppSelector((state) => state.activity.activities);

  const section = enrollmentView?.section;
  const course = section?.course;
  const sectionId = section?.id;

  useEffect(() => {
    if (sectionId) dispatch(fetchActivity(sectionId));
  }, [dispatch, sectionId]);

  const totalActivities = activities.length;
  const completedActivities = gradesUser.length;
  const progressPct =
    totalActivities > 0 ? Math.min(Math.round((completedActivities / totalActivities) * 100), 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 h-full flex flex-col">
      <h3 className="font-semibold text-gray-800">Curso Actual</h3>
      <div className="flex-grow flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mt-4">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex-shrink-0">
          <Image
            src={course?.imageUrl || "/photos/makeup.webp"}
            alt={course?.name || "Curso"}
            width={100}
            height={100}
            className="object-cover w-full h-full rounded-full"
          />
        </div>
        <div className="flex-grow min-w-0 w-full text-center sm:text-left">
          {enrollmentView ? (
            <>
              <h4 className="text-xl sm:text-2xl font-bold text-gray-800">{course?.name}</h4>
              {section?.name ? (
                <p className="text-sm text-rose font-medium mt-0.5">{section.name}</p>
              ) : null}
              <div className="md-content text-gray-600 mt-2 text-sm sm:text-base">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                  {course?.description ?? ""}
                </ReactMarkdown>
              </div>

              {totalActivities > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-darkpink h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {completedActivities} de {totalActivities} actividades completadas
                  </p>
                </div>
              )}
            </>
          ) : enrollmentStatus === "loading" || enrollmentStatus === "idle" ? (
            <div className="space-y-2 w-full">
              <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto sm:mx-0 animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-gray-500 font-medium">Sin cursos activos</p>
              <p className="text-sm text-gray-400">Cuando te matricules en un curso aparecerá aquí.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
