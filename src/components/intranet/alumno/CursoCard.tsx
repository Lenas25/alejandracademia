"use client";

import { fetchEnrollmentByUser } from "@/redux/service/enrollmentService";
import { fetchActivity } from "@/redux/service/activityService";
import { setEnrollmentsUser } from "@/redux/slices/enrollmentSlice";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { calculateWeightedAverage } from "@/utils/gradeAverage";

export function CursoCard() {
  const dispatch = useAppDispatch();
  const enrollmentsPerUser = useAppSelector(
    (state) => state.enrollment.enrollmentsUser
  ).filter((enrollment) => enrollment.active);
  const userLogin = useAppSelector((state) => state.user.userLogin);
  // Enrollment now relates to a Section (renamed from the old Course).
  // Activities are still keyed by the Section id (fetchActivity), while the
  // card's displayed name/image/description come from the parent catalog
  // Course via the nested Section -> Course relation.
  const sections = enrollmentsPerUser.flatMap((enrollment) => enrollment.section);
  const [currentCourse, setCurrentCourse] = useState<number>(0);
  const gradesUser = useAppSelector((state) => state.grade.gradesUser);
  const activities = useAppSelector((state) => state.activity.activities);
  const enrollmentStatus = useAppSelector((state) => state.enrollment.status);

  useEffect(() => {
    dispatch(setEnrollmentsUser(enrollmentsPerUser[currentCourse]));
  }, [enrollmentsPerUser, dispatch, currentCourse]);

  useEffect(() => {
    dispatch(fetchEnrollmentByUser({ userId: userLogin?.id?.toString() }));
  }, [dispatch, userLogin?.id]);

  useEffect(() => {
    const sectionId = sections[currentCourse]?.id;
    if (sectionId) dispatch(fetchActivity(sectionId));
  }, [dispatch, sections[currentCourse]?.id]);

  const handlePrevCourse = () => {
    if (currentCourse > 0) {
      dispatch(setEnrollmentsUser(sections[currentCourse - 1]));
      setCurrentCourse((prev) => prev - 1);
    }
  };

  const handleNextCourse = () => {
    if (currentCourse < sections.length - 1) {
      dispatch(setEnrollmentsUser(sections[currentCourse + 1]));
      setCurrentCourse((prev) => prev + 1);
    }
  };

    return (
    <div className="bg-white rounded-2xl shadow-sm p-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Curso Actual</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePrevCourse}
            className="p-1 text-gray-500 hover:text-black"
            disabled={currentCourse === 0}
          >
            <IconChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={handleNextCourse}
            className="p-1 text-gray-500 hover:text-black"
            disabled={currentCourse === sections.length - 1 || sections.length === 0}
          >
            <IconChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="flex-grow flex items-center gap-6 mt-4">
        <div className="w-24 h-24 rounded-full flex-shrink-0">
          <Image
            src={sections[currentCourse]?.course?.imageUrl || "/makeup.webp"}
            alt={sections[currentCourse]?.course?.name || "Curso"}
            width={100}
            height={100}
            className="object-cover w-full h-full rounded-full"
          />
        </div>
        <div className="flex-grow">
          {sections[currentCourse] ? (
            <>
              <h4 className="text-2xl font-bold text-gray-800 mt-1">
                {sections[currentCourse]?.course?.name}
              </h4>
              <p className="text-gray-600 mt-2">
                {sections[currentCourse]?.course?.description}
              </p>

              {/* Barra de progreso de actividades */}
              {(() => {
                const total = activities.length;
                const completadas = gradesUser.length;
                if (total === 0) return null;
                const pct = Math.min(Math.round((completadas / total) * 100), 100);
                const average = calculateWeightedAverage(gradesUser);
                return (
                  <div className="mt-3">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-darkpink h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">
                        {completadas} de {total} actividades completadas
                      </p>
                      <p className="text-xs font-semibold text-gray-600">
                        Promedio: {average === null ? "—" : average.toFixed(1)}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </>
          ) : enrollmentStatus === 'loading' || enrollmentStatus === 'idle' ? (
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
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
