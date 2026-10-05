import rutas from "@/utils/endpoints";
import { Course, CreateCourse } from "@/types/course";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { mapApiError } from "@/utils/extractErrorMessage";

const coursesAPI = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}${rutas.courses}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await coursesAPI.get('/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });
      return {message: response.data.message, data: response.data.data};
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(mapApiError(error));
      }
      return rejectWithValue(mapApiError(error));
    }
  }
);

export const createCourse = createAsyncThunk(
    'courses/createCourse',
    async (data: CreateCourse , { dispatch }) => {
      try {
        const response = await coursesAPI.post('/', data, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          },
        });
        dispatch(fetchCourses());
        return { message: response.data.message, data: response.data.data };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          return { message: "Error al crear el curso", error: mapApiError(error) };
        }
        return { message: "Ocurrió un error inesperado", error: mapApiError(error) };
      }
    }
);

export const updateCourse = createAsyncThunk(
    'courses/updateCourse',
    async ({ courseId, data }: { courseId: number | undefined, data: Course }, { dispatch }) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, updatedAt, createdAt, ...rest } = data;
        const response = await coursesAPI.patch(`${courseId}/`, rest, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          },
        });
        dispatch(fetchCourses());
        return { message: response.data.message, data: response.data.data };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          return { message: "Error al editar el curso", error: mapApiError(error) };
        }
        return { message: "Ocurrió un error inesperado", error: mapApiError(error) };
      }
    }
);

export const deleteCourse = createAsyncThunk(
    'courses/deleteCourse',
    async (courseId: number | undefined, { dispatch }) => {
      try {
        const response = await coursesAPI.delete(`${courseId}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          },
        });
        dispatch(fetchCourses());
        return { message: response.data.message, data: response.data.data };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          return { message: "Error al eliminar el curso", error: mapApiError(error) };
        }
        return { message: "Ocurrió un error inesperado", error: mapApiError(error) };
      }
    }
);