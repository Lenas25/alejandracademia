import rutas from "@/utils/endpoints";
import { Section, CreateSection } from "@/types/section";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const sectionsAPI = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}${rutas.sections}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchSections = createAsyncThunk(
  'sections/fetchSections',
  async (_, { rejectWithValue }) => {
    try {
      const response = await sectionsAPI.get('/', {
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

export const fetchSectionById = createAsyncThunk(
  'sections/fetchSectionById',
  async (sectionId: number, { rejectWithValue }) => {
    try {
      const response = await sectionsAPI.get(`/${sectionId}`, {
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

export const createSection = createAsyncThunk(
    'sections/createSection',
    async (data: CreateSection , { dispatch }) => {
      try {
        const response = await sectionsAPI.post('/', data, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          },
        });
        dispatch(fetchSections());
        return { message: response.data.message, data: response.data.data };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          return { message: "Error al crear la sección", error: error.response.data.error };
        }
        return { message: "An unexpected error occurred", error: "Unexpected error" };
      }
    }
);

export const updateSection = createAsyncThunk(
    'sections/updateSection',
    async ({ sectionId, data }: { sectionId: number | undefined, data: Section }, { dispatch }) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, updatedAt, createdAt, ...rest } = data;
        const response = await sectionsAPI.patch(`${sectionId}/`, rest, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          },
        });
        dispatch(fetchSections());
        return { message: response.data.message, data: response.data.data };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          return { message: "Error al editar la sección", error: error.response.data.error };
        }
        return { message: "An unexpected error occurred", error: "Unexpected error" };
      }
    }
);

export const deleteSection = createAsyncThunk(
    'sections/deleteSection',
    async (sectionId: number | undefined, { dispatch }) => {
      try {
        const response = await sectionsAPI.delete(`${sectionId}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          },
        });
        dispatch(fetchSections());
        return { message: response.data.message, data: response.data.data };
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          return { message: "Error al eliminar la sección", error: error.response.data.error };
        }
        return { message: 'An unknown error occurred' };
      }
    }
);
