import rutas from "@/utils/endpoints";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { AsignGrade } from "@/types/grade";

const gradeAPI = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}${rutas.grade}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchGrade = createAsyncThunk(
  'grades/fetchGrade',
  async (activityId: number, { rejectWithValue }) => {
    try {
      const response = await gradeAPI.get(`/${activityId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });

      return { message: response.data.message, data: response.data.data };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const updateGrade = createAsyncThunk(
  'grades/updateGrade',
  async ({ courseId, data }: { courseId: number | undefined; data: AsignGrade }, { dispatch, rejectWithValue }) => {
    try {
      const response = await gradeAPI.patch(`/${courseId}`, data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });
      dispatch(fetchGrade(response.data.data[0].id_activity));
      return { message: response.data.message, data: response.data.data };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const gradeByEnrollment = createAsyncThunk(
  'grades/gradeByEnrollment',
  async (enrollmentId: number | undefined, { rejectWithValue }) => {
    try {
      const response = await gradeAPI.get(`/enrollment/${enrollmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });

      return { message: response.data.message, data: response.data.data };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);