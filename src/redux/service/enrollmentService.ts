import rutas from "@/utils/endpoints";
import { CreateEnrollment } from "@/types/enrollment";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { fetchCourses } from "./courseService";

const enrollmentAPI = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}${rutas.enrollment}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// by course
export const fetchEnrollment = createAsyncThunk(
  'enrollments/fetchEnrollment',
  async ({ courseId }: { courseId: number | undefined }, { rejectWithValue }) => {
    try {
      if (courseId) {
        const response = await enrollmentAPI.get(`/course/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          },
        });
        return response.data.data;
      }
      return [];
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

// by user
export const fetchEnrollmentByUser = createAsyncThunk(
  'enrollments/fetchEnrollmentByUser',
  async ({ userId }: { userId: string | undefined }, { rejectWithValue }) => {
    try {
      if (userId) {
        const response = await enrollmentAPI.get(`/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          },
        });
        return response.data.data;
      }
      return [];
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const updateEnrollment = createAsyncThunk(
    'enrollments/updateEnrollment',
    async ({ courseId, data }: { courseId: number | undefined, data: CreateEnrollment }, { dispatch }) => {
      try {
        const response = await enrollmentAPI.patch(`/${courseId}/`, data, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          },
        });
        dispatch(fetchEnrollment({ courseId }));
        return { message: response.data.message, data: response.data.data };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          return { message: "Error al editar el usuario", error: error.response.data.error };
        }
        return { message: "An unexpected error occurred", error: "Unexpected error" };
      }
    }
);

export const finishEnrollment = createAsyncThunk(
  'enrollments/finishEnrollment',
  // `courseId` here is actually the section id — kept as-is to match the
  // naming already used by every sibling call site (fetchEnrollment,
  // updateEnrollment, NotasTab, CuadrosAsignar, RowStudents all pass
  // `selectedSection.id` as `courseId`; "course" is legacy naming from
  // before `Section` was split out of `Course`, see types/section.ts).
  async ({ courseId }: { courseId: number | undefined }, { dispatch }) => {
    try {
      const response = await enrollmentAPI.patch(`/finish/${courseId}`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });
      dispatch(fetchEnrollment({ courseId }));
      dispatch(fetchCourses());
      return { message: response.data.message, data: response.data.data };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return { message: "Error al finalizar la inscripción", error: error.response.data.error };
      }
      return { message: "An unexpected error occurred", error: "Unexpected error" };
    }
  }
);

export const reopenEnrollment = createAsyncThunk(
  'enrollments/reopenEnrollment',
  // Same `courseId` = section id convention as `finishEnrollment` above.
  async ({ courseId }: { courseId: number | undefined }, { dispatch }) => {
    try {
      const response = await enrollmentAPI.patch(`/reopen/${courseId}`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });
      dispatch(fetchEnrollment({ courseId }));
      return { message: response.data.message, data: response.data.data };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return { message: "Error al reabrir la sección", error: error.response.data.error };
      }
      return { message: "An unexpected error occurred", error: "Unexpected error" };
    }
  }
);