"use client";

import { fetchEnrollmentByUser } from "@/redux/service/enrollmentService";
import { setSelectedEnrollment } from "@/redux/slices/enrollmentSlice";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import type { Enrollment } from "@/types/enrollment";
import { useEffect } from "react";

// Top-level course scope selector. Owns the initial `enrollmentsUser` fetch
// and the default-selection logic that used to live buried inside
// CursoCard's chevrons (which dispatched a Section into `enrollmentView`,
// a bug — see CursoCard.tsx). Selecting a chip here scopes every card below
// (CursoCard, SummaryTiles, NotasCard, AsistenciaCard, CuotasCard) via the
// shared `enrollmentView` in redux.
const MAX_CHIPS = 3;

function optionLabel(enrollment: Enrollment): string {
  const courseName = enrollment.section?.course?.name || "Curso";
  const sectionName = enrollment.section?.name;
  return sectionName ? `${courseName} · ${sectionName}` : courseName;
}

export function CourseSelector() {
  const dispatch = useAppDispatch();
  const userLogin = useAppSelector((state) => state.user.userLogin);
  const enrollmentsUser = useAppSelector((state) => state.enrollment.enrollmentsUser);
  const enrollmentView = useAppSelector((state) => state.enrollment.enrollmentView);

  useEffect(() => {
    dispatch(fetchEnrollmentByUser({ userId: userLogin?.id?.toString() }));
  }, [dispatch, userLogin?.id]);

  // Keep a valid selection at all times: pick a default the first time
  // enrollments load, and re-pick if the previously selected enrollment is
  // no longer present in the list (e.g. after a refetch).
  useEffect(() => {
    if (enrollmentsUser.length === 0) return;
    const stillValid =
      enrollmentView && enrollmentsUser.some((enrollment) => enrollment.id === enrollmentView.id);
    if (stillValid) return;
    const defaultEnrollment =
      enrollmentsUser.find((enrollment) => enrollment.active) ?? enrollmentsUser[0];
    dispatch(setSelectedEnrollment(defaultEnrollment));
  }, [enrollmentsUser, enrollmentView, dispatch]);

  // Hidden entirely when the student has only one enrollment — nothing to
  // choose between.
  if (enrollmentsUser.length <= 1) return null;

  // Many courses: a compact native select scales better than chips.
  if (enrollmentsUser.length > MAX_CHIPS) {
    return (
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <label htmlFor="course-select" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Curso
        </label>
        <select
          id="course-select"
          value={enrollmentView?.id ?? ""}
          onChange={(e) => {
            const picked = enrollmentsUser.find((enrollment) => String(enrollment.id) === e.target.value);
            if (picked) dispatch(setSelectedEnrollment(picked));
          }}
          className="select select-bordered h-11 min-h-11 w-full sm:max-w-md bg-white text-sm">
          {enrollmentsUser.map((enrollment) => (
            <option key={enrollment.id} value={enrollment.id}>
              {optionLabel(enrollment)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tus cursos</p>
      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {enrollmentsUser.map((enrollment) => {
          const isSelected = enrollmentView?.id === enrollment.id;
          const label = optionLabel(enrollment);

          return (
            <button
              key={enrollment.id}
              type="button"
              title={label}
              onClick={() => dispatch(setSelectedEnrollment(enrollment))}
              aria-pressed={isSelected}
              className={`shrink-0 max-w-[16rem] truncate rounded-full px-4 py-2 min-h-11 text-sm font-medium whitespace-nowrap transition-colors ${
                isSelected
                  ? "bg-darkpink text-white"
                  : "bg-white text-black border border-grey hover:bg-lightpink"
              }`}>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
