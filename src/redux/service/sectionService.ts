import rutas from "@/utils/endpoints";
import { CreateSection, Section, UpdateSection } from "@/types/section";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const sectionsAPI = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}${rutas.sections}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Extracts a human-readable reason from a backend error response. NestJS
// produces two different shapes depending on where the rejection happens:
//   - ValidationPipe rejections (400, before the controller runs): the real
//     field-level reason lives in `message` (string[]) while `error` is just
//     the generic HTTP reason phrase ("Bad Request", "Unauthorized").
//   - Controller-level catch blocks (SectionController.create/update/remove):
//     `message` is a generic label ("Error al editar la sección") while
//     `error` holds the actual thrown reason.
// Both fields can carry useful, non-overlapping information, so combine
// whatever is present instead of picking one and discarding the other.
function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data as { message?: string | string[]; error?: string } | undefined;
    const reasons: string[] = [];
    if (Array.isArray(data?.message)) reasons.push(...data.message);
    else if (typeof data?.message === 'string') reasons.push(data.message);
    if (typeof data?.error === 'string' && !reasons.includes(data.error)) reasons.push(data.error);
    return reasons.length > 0 ? reasons.join(' — ') : 'Ocurrió un error inesperado';
  }
  return 'No se pudo conectar con el servidor';
}

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
        return rejectWithValue(extractErrorMessage(error));
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
        return rejectWithValue(extractErrorMessage(error));
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
