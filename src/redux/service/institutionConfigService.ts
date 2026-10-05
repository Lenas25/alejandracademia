import rutas from "@/utils/endpoints";
import { mapApiError } from "@/utils/extractErrorMessage";
import { InstitutionConfig } from "@/types/institutionConfig";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Constancia de Calificaciones backend-driven config (PLAN_FEATURES 4.4
// polish). Single-row resource — no id param on either verb, mirrors the
// `GET/PATCH /institution-config` contract exactly. Follows
// reportService/paymentService's typed-thunk + extractErrorMessage
// convention.
const institutionConfigAPI = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}${rutas.institutionConfig}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Read (admin+tutor) — used both by the admin configurator page to seed the
// form and by NotasTab before generating a PDF.
export const fetchInstitutionConfig = createAsyncThunk<
  { message: string; data: InstitutionConfig },
  void,
  { rejectValue: string }
>(
  'institutionConfig/fetchInstitutionConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await institutionConfigAPI.get('', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });
      return { message: response.data.message, data: response.data.data };
    } catch (error) {
      return rejectWithValue(mapApiError(error));
    }
  }
);

// Partial update (admin only) — the configurator page's Save action.
// Backend returns the full, merged config.
export const updateInstitutionConfig = createAsyncThunk<
  { message: string; data: InstitutionConfig },
  Partial<Omit<InstitutionConfig, "id">>,
  { rejectValue: string }
>(
  'institutionConfig/updateInstitutionConfig',
  async (data, { rejectWithValue }) => {
    try {
      const response = await institutionConfigAPI.patch('', data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });
      return { message: response.data.message, data: response.data.data };
    } catch (error) {
      return rejectWithValue(mapApiError(error));
    }
  }
);
