import rutas from "@/utils/endpoints";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const activityAPI = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}${rutas.activity}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchActivity = createAsyncThunk(
  'activity/fetchActivity',
  async (courseId: number | undefined, { rejectWithValue }) => {
    try {
      const response = await activityAPI.get(`/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });
     
      return {message: response.data.message, data: response.data.data};
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);