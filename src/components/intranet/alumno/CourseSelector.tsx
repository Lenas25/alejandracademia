"use client";

import { fetchEnrollmentByUser } from "@/redux/service/enrollmentService";
import { setSelectedEnrollment } from "@/redux/slices/enrollmentSlice";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { useEffect } from "react";

// Top-level course scope selector. Owns the initial `enrollmentsUser` fetch
// and the default-selection logic that used to live buried inside
// CursoCard's chevrons (which dispatched a Section into `enrollmentView`,
// a bug — see CursoCard.tsx). Selecting a chip here scopes every card below
// (CursoCard, PromedioCard, ContextStrip, NotasCard, CuotasCard) via the
// shared `enrollmentView` in redux.
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

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Tus cursos
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
        {enrollmentsUser.map((enrollment) => {
          const isSelected = enrollmentView?.id === enrollment.id;
          const courseName = enrollment.section?.course?.name || "Curso";
          const sectionName = enrollment.section?.name;

          return (
            <button
              key={enrollment.id}
              type="button"
              onClick={() => dispatch(setSelectedEnrollment(enrollment))}
              aria-pressed={isSelected}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                isSelected
                  ? "bg-darkpink text-white"
                  : "bg-white text-black border border-grey hover:bg-lightpink"
              }`}
            >
              {courseName}
              {sectionName ? (
                <span className={isSelected ? "text-white/80" : "text-gray-400"}>
                  {" "}
                  · {sectionName}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
