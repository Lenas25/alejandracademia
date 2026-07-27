import rutas from "@/utils/endpoints";
import { extractErrorMessage } from "@/utils/extractErrorMessage";
import { SectionReport } from "@/types/report";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Reuses the `/grade` base — `GET /grade/report/:id` (`:id` = SECTION id)
// lives under the grade module on the backend (see engram
// sdd/pdf-report/apply-progress). Mirrors paymentService's typed-thunk +
// extractErrorMessage convention.
const reportAPI = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}${rutas.grade}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Constancia de Calificaciones PDF export (PLAN_FEATURES 4.4). Fetches the
// full per-student grade report for a section (admin/tutor + ownership,
// enforced server-side) so `generateConstanciaPdf` can build one PDF page
// per active student.
export const fetchSectionReport = createAsyncThunk<
  { message: string; data: SectionReport },
  number,
  { rejectValue: string }
>(
  'report/fetchSectionReport',
  async (sectionId, { rejectWithValue }) => {
    try {
      const response = await reportAPI.get(`/report/${sectionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });
      return { message: response.data.message, data: response.data.data };
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);
