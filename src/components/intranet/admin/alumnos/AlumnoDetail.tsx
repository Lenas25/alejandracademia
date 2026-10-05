"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { IconListDetails, IconStarsFilled } from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { fetchEnrollmentByUser } from "@/redux/service/enrollmentService";
import { gradeByEnrollment } from "@/redux/service/gradeService";
import { fetchUsers } from "@/redux/service/userService";
import { Enrollment } from "@/types/enrollment";
import { User } from "@/types/user";
import { PASSING_GRADE } from "@/utils/gradeScale";

interface AlumnoDetailProps {
  userId: string;
}

// `enrollment_date` comes back as an ISO datetime string; format by string
// splitting instead of `new Date(...)` to avoid the timezone-shift bug
// documented in src/types/payment.ts.
function formatEnrollmentDate(value: Date | string): string {
  const iso = String(value ?? "");
  const [datePart] = iso.split("T");
  const [year, month, day] = datePart.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

// Backend `user` relation is typed `User[] | User` but is singular at runtime.
function enrollmentUser(enrollment: Enrollment | null): User | undefined {
  if (!enrollment?.user) return undefined;
  return Array.isArray(enrollment.user) ? enrollment.user[0] : enrollment.user;
}

// A matrícula counts as Finalizada if either side says so; `final_grade` is
// only trustworthy once the section finished (stale while it's active).
function isFinished(enrollment: Enrollment): boolean {
  return !enrollment.active || enrollment.section?.isActive === false;
}

function AlumnoDetail({ userId }: AlumnoDetailProps) {
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.user?.users);
  const enrollmentsUser = useAppSelector(
    (state) => state.enrollment.enrollmentsUser
  );
  const enrollmentStatus = useAppSelector((state) => state.enrollment?.status);
  const enrollmentError = useAppSelector(
    (state) => state.enrollment?.errorMessage
  );
  const gradesUser = useAppSelector((state) => state.grade.gradesUser);
  const gradeStatus = useAppSelector((state) => state.grade?.status);

  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<
    number | null
  >(null);

  useEffect(() => {
    dispatch(fetchEnrollmentByUser({ userId }));
  }, [dispatch, userId]);

  // Header fallback for an alumno with zero enrollments (no `user` relation
  // to read from). Skip the fetch if the table already populated the store.
  useEffect(() => {
    if (!users || users.length === 0) {
      dispatch(fetchUsers());
    }
  }, [dispatch, users]);

  // Keep a valid selection: default to the first active enrollment, re-pick
  // if the selected one disappears (e.g. after a refetch).
  useEffect(() => {
    if (enrollmentsUser.length === 0) return;
    const stillValid = enrollmentsUser.some(
      (enrollment) => enrollment.id === selectedEnrollmentId
    );
    if (stillValid) return;
    const defaultEnrollment =
      enrollmentsUser.find((enrollment) => !isFinished(enrollment)) ??
      enrollmentsUser[0];
    setSelectedEnrollmentId(defaultEnrollment.id);
  }, [enrollmentsUser, selectedEnrollmentId]);

  const selectedEnrollment = useMemo(
    () =>
      enrollmentsUser.find(
        (enrollment) => enrollment.id === selectedEnrollmentId
      ) ?? null,
    [enrollmentsUser, selectedEnrollmentId]
  );

  useEffect(() => {
    if (selectedEnrollment && !isFinished(selectedEnrollment)) {
      dispatch(gradeByEnrollment(selectedEnrollment.id));
    }
  }, [dispatch, selectedEnrollment]);

  const alumno =
    users?.find((user) => String(user.id) === String(userId)) ??
    enrollmentUser(enrollmentsUser[0] ?? null);

  return (
    <>
      <div className="flex flex-col gap-2 mb-5 bg-black rounded-lg shadow relative p-4 sm:p-6 md:p-8 overflow-x-clip">
        <div className="text-sm text-gray-400">
          <Link href=".." className="hover:text-white">
            Alumnos
          </Link>{" "}
          / Historial
        </div>
        <h1 className="text-xl sm:text-2xl font-medium text-white break-words">
          {alumno
            ? `${alumno.name ?? ""} ${alumno.lastName ?? ""}`.trim() ||
              `Alumno #${userId}`
            : `Alumno #${userId}`}
        </h1>
        {alumno && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-300">
            <span className="break-words">DNI: {alumno.id}</span>
            {alumno.email && (
              <span className="break-all">Email: {alumno.email}</span>
            )}
            {alumno.phone && <span className="break-words">Celular: {alumno.phone}</span>}
          </div>
        )}
      </div>

      <div className="overflow-x-clip bg-white rounded-lg shadow relative p-3 sm:p-6 md:p-10 max-w-full">
        {enrollmentStatus === "loading" ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-lg text-darkpink" />
          </div>
        ) : enrollmentStatus === "failed" ? (
          <p className="text-center py-10 text-red-500">
            {enrollmentError ?? "No se pudo cargar el historial del alumno"}
          </p>
        ) : enrollmentsUser.length === 0 ? (
          <p className="text-center py-10 text-gray-400">
            Este alumno no tiene matrículas registradas
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Matrículas
              </p>
              <div className="flex flex-col gap-3">
                {enrollmentsUser.map((enrollment) => {
                  const finished = isFinished(enrollment);
                  const isSelected =
                    selectedEnrollmentId === enrollment.id;
                  return (
                    <button
                      key={enrollment.id}
                      type="button"
                      onClick={() => setSelectedEnrollmentId(enrollment.id)}
                      aria-pressed={isSelected}
                      className={`w-full text-left rounded-lg border p-3 sm:p-4 min-h-10 transition-colors ${
                        isSelected
                          ? "border-darkpink bg-lightpink"
                          : "border-grey bg-white hover:bg-gray-50"
                      }`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0 flex-1 basis-48">
                          <h3 className="font-semibold text-gray-800 break-words">
                            {enrollment.section?.course?.name || "Curso"}
                          </h3>
                          <p className="text-sm text-gray-500 break-words">
                            {enrollment.section?.name} · Matriculado:{" "}
                            {formatEnrollmentDate(enrollment.enrollment_date)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <span
                            className={`badge border-none font-semibold ${
                              finished
                                ? "bg-yellow text-black"
                                : "bg-darkpink text-white"
                            }`}>
                            {finished ? "Finalizada" : "Activa"}
                          </span>
                          {finished && (
                            <span className="text-sm font-bold text-gray-700">
                              Nota final: {enrollment.final_grade ?? "-"}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedEnrollment && (
              <div>
                <div className="flex justify-between items-center gap-3 mb-4">
                  <h3 className="text-base sm:text-lg font-medium text-gray-700 min-w-0">
                    {isFinished(selectedEnrollment)
                      ? "Nota final"
                      : "Notas por actividad"}
                  </h3>
                  <IconListDetails size={24} className="text-gray-400 shrink-0" />
                </div>
                {isFinished(selectedEnrollment) ? (
                  <div className="flex justify-between items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-gray-800 break-words min-w-0">
                      {selectedEnrollment.section?.course?.name || "Curso"} ·{" "}
                      {selectedEnrollment.section?.name}
                    </h4>
                    <div
                      className={`text-lg font-bold text-white w-12 h-12 shrink-0 flex items-center justify-center rounded-full ${
                        Number(selectedEnrollment.final_grade) >= PASSING_GRADE
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}>
                      {selectedEnrollment.final_grade ?? "-"}
                    </div>
                  </div>
                ) : gradeStatus === "loading" ? (
                  <div className="flex justify-center py-6">
                    <span className="loading loading-spinner text-gray-300" />
                  </div>
                ) : gradeStatus === "failed" ? (
                  <p className="text-center py-6 text-red-500">
                    No se pudieron cargar las notas
                  </p>
                ) : gradesUser.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {gradesUser.map((grade) => {
                      const numericGrade = Number(grade.grade);
                      const isApproved = numericGrade >= PASSING_GRADE;
                      return (
                        <div
                          key={grade.id_activity}
                          className="flex justify-between items-center gap-3 bg-gray-50 p-3 rounded-lg">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-800 break-words">
                              {grade.activity.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Peso: {grade.activity.percentage}%
                            </p>
                          </div>
                          <div
                            className={`text-lg font-bold text-white w-12 h-12 shrink-0 flex items-center justify-center rounded-full ${
                              isApproved ? "bg-green-500" : "bg-red-500"
                            }`}>
                            {Math.round(numericGrade)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 text-center py-8">
                    <IconStarsFilled size={40} className="text-gray-200" />
                    <div>
                      <p className="font-medium text-gray-500">
                        Sin notas registradas
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Las notas aparecerán aquí cuando estén disponibles.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default AlumnoDetail;
