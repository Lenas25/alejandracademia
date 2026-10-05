import rutas from "@/utils/endpoints";
import { mapApiError } from "@/utils/extractErrorMessage";
import { CreateSection, Section, UpdateSection } from "@/types/section";
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
        return rejectWithValue(mapApiError(error));
      }
      return rejectWithValue(mapApiError(error));
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
        return rejectWithValue(mapApiError(error));
      }
      return rejectWithValue(mapApiError(error));
    }
  }
);

export const createSection = createAsyncThunk<
  { message: string; data: Section },
  CreateSection,
  { rejectValue: string }
>(
    'sections/createSection',
    async (data, { dispatch, rejectWithValue }) => {
      try {
        const response = await sectionsAPI.post('/', data, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          },
        });
        dispatch(fetchSections());
        return { message: response.data.message, data: response.data.data };
      } catch (error) {
        return rejectWithValue(mapApiError(error));
      }
    }
);

// `data` MUST already be shaped like `UpdateSectionDto` (see types/section.ts
// `UpdateSection`) — scalars only (`id_course`, `id_tutor`), never the
// nested `course`/`tutor` objects or a raw `Activity[]`. The backend's
// global ValidationPipe runs `forbidNonWhitelisted: true`, so any
// non-whitelisted property would be rejected with a 400 (fixed per PR3
// verify-report WARNING — the previous signature accepted a full `Section`
// entity and stripped only 3 fields, leaving `course`/`tutor`/`activities`
// relation objects in the PATCH body).
export const updateSection = createAsyncThunk<
  { message: string; data: Section },
  { sectionId: number | undefined; data: UpdateSection },
  { rejectValue: string }
>(
    'sections/updateSection',
    async ({ sectionId, data }, { dispatch, rejectWithValue }) => {
      try {
        const response = await sectionsAPI.patch(`${sectionId}/`, data, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          },
        });
        dispatch(fetchSections());
        return { message: response.data.message, data: response.data.data };
      } catch (error) {
        return rejectWithValue(mapApiError(error));
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
          return { message: "Error al eliminar la sección", error: mapApiError(error) };
        }
        return { message: "Ocurrió un error inesperado", error: mapApiError(error) };
      }
    }
);
