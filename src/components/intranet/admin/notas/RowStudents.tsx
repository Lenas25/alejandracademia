"use client";

import { fetchEnrollment } from "@/redux/service/enrollmentService";
import { fetchGrade, updateGrade } from "@/redux/service/gradeService";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { Activity } from "@/types/activity";
import { Course } from "@/types/course";
import { Enrollment } from "@/types/enrollment";
import { GradeReceive } from "@/types/grade";
import { PayloadAction } from "@reduxjs/toolkit";
import { IconArrowRight } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

interface RowStudentsProps {
  selectedCourse: Course | null;
  selectedActivity: Activity | null;
}

function RowStudents({ selectedCourse, selectedActivity }: RowStudentsProps) {
  const dispatch = useAppDispatch();
  const gradesPerActivity = useAppSelector(
    (state) => state.grade.grades
  ).filter((gr) => gr.enrollment.active);
  const enrollments = useAppSelector((state) => state.enrollment.enrollments);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (selectedCourse && selectedActivity) {
      dispatch(fetchEnrollment({ courseId: selectedCourse.id }));
      if (selectedActivity?.id !== undefined) {
        dispatch(fetchGrade(selectedActivity.id));
      }
    }
  }, [selectedCourse, selectedActivity, dispatch]);

  const defaultValues = {
    grades: enrollments.map((enrollment) => {
      const grade = gradesPerActivity.find((g) => g.id_enrollment === enrollment.id);
      return {
        id_activity: selectedActivity?.id ?? 0,
        id_enrollment: enrollment.id,
        grade: grade ? grade.grade : 0,
        enrollment: enrollment,
      };
    }),
  };
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues,
  });

  useEffect(() => {
    defaultValues.grades.forEach((gr, index) => {
      setValue(`grades.${index}.grade`, Number(gr.grade));
      setValue(`grades.${index}.id_enrollment`, gr.id_enrollment);
    });
  }, [setValue, defaultValues.grades]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const onSubmit = async (data: { grades: { id_activity: number; id_enrollment: number; grade: number; enrollment: Enrollment; }[] }) => {
    const dataSend = {
      id_activity: selectedActivity?.id ?? 0,
      grades: data.grades.map((gr: {id_enrollment:number; grade:number}) => ({
        id_enrollment: Number(gr.id_enrollment) || 0,
        grade: Number(gr.grade) || 0,
      })),
    };
    
    const resultAction = (await dispatch(updateGrade({courseId:selectedCourse?.id, data: dataSend}))) as PayloadAction<{
      message: string;
      data: GradeReceive[];
    }>;
    setMessage((resultAction.payload as { message: string }).message);
  };

  return (
    selectedCourse &&
    selectedActivity && (
      <div className="flex flex-col gap-5 md:h-[350px] md:w-full">
        {message && (
          <div className="alert alert-danger my-5 text-white ">{message}</div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto">
          <div className="flex flex-col gap-3 h-80 overflow-y-auto w-full md:flex-1 md:h-[270px]">
            {defaultValues.grades.map((gr, index) => (
              <div key={gr.id_enrollment}>
                <div className="flex flex-row justify-between">
                  <p className="flex gap-2 items-center md:w-full">
                    {gr.enrollment.user[0].id}
                    <IconArrowRight />
                    {gr.enrollment.user[0].name} {gr.enrollment.user[0].lastName}
                  </p>
                  <input
                    defaultValue={gr.id_enrollment}
                    type="hidden"
                    {...register(`grades.${index}.id_enrollment`)}
                  />
                  <input
                    type="number"
                    {...register(`grades.${index}.grade`, {
                      required: "Este campo es requerido",
                      min: { value: 0, message: "La nota mínima es 0" },
                      max: { value: 20, message: "La nota máxima es 20" },
                    })}
                    className="input input-bordered w-20 md:w-[30%] bg-transparent text-black pr-5"
                  />
                </div>
                {errors.grades?.[index] && (
                  <p className="text-red-500 text-sm font-semibold">
                    {errors.grades?.[index]?.grade?.message}
                  </p>
                )}
              </div>
            ))}
          </div>
          <button
            type="submit"
            className="btn btn-ghost w-full mt-5 bg-black text-white text-base hover:text-black">
            Guardar
          </button>
        </form>
      </div>
    )
  );
}

export default RowStudents;
