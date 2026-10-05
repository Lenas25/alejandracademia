import rutas from "@/utils/endpoints";
import { mapApiError } from "@/utils/extractErrorMessage";
import {
  AttendanceDayDetail,
  AttendanceDaySummary,
  AttendanceEnrollmentView,
  AttendanceMetricRow,
  AttendanceRecord,
} from "@/types/attendance";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const attendanceAPI = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}${rutas.attendance}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Section Detail Asistencia Tab — "Agregar día" action (spec: locked
// decision, backend generates all-present rows for every active
// enrollment). 409 (day already exists for that section+date) is a normal,
// user-facing outcome — surfaced via extractErrorMessage, not swallowed.
export const createAttendanceDay = createAsyncThunk<
  { message: string; data: AttendanceDaySummary },
  { sectionId: number; date: string },
  { rejectValue: string }
>(
  'attendance/createAttendanceDay',
  async ({ sectionId, date }, { rejectWithValue }) => {
    try {
      const response = await attendanceAPI.post(
        '/day',
        { sectionId, date },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          },
        }
      );
      return { message: response.data.message, data: response.data.data };
    } catch (error) {
      // 409 (day already exists for that section+date) is a normal,
      // user-facing outcome (locked decision) — surfaced with a friendly
      // Spanish message instead of the raw backend conflict text. Every
      // other failure still goes through extractErrorMessage so the real
      // reason is never swallowed.
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        return rejectWithValue("Ya existe un registro para esa fecha");
      }
      return rejectWithValue(mapApiError(error));
    }
  }
);

// Registro list — one row per attendance day for the section.
export const fetchAttendanceDays = createAsyncThunk<
  { message: string; data: AttendanceDaySummary[] },
  number,
  { rejectValue: string }
>(
  'attendance/fetchAttendanceDays',
  async (sectionId, { rejectWithValue }) => {
    try {
      const response = await attendanceAPI.get(`/section/${sectionId}`, {
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

// Roster for a single day — loaded on accordion expand.
export const fetchAttendanceDay = createAsyncThunk<
  { message: string; data: AttendanceDayDetail },
  number,
  { rejectValue: string }
>(
  'attendance/fetchAttendanceDay',
  async (dayId, { rejectWithValue }) => {
    try {
      const response = await attendanceAPI.get(`/day/${dayId}`, {
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

// Bulk "Guardar día" save — one PATCH with every toggled record, never
// per-checkbox requests (locked decision).
export const updateAttendanceDay = createAsyncThunk<
  { message: string; data: AttendanceDayDetail },
  { dayId: number; records: AttendanceRecord[] },
  { rejectValue: string }
>(
  'attendance/updateAttendanceDay',
  async ({ dayId, records }, { rejectWithValue }) => {
    try {
      const response = await attendanceAPI.patch(
        `/day/${dayId}`,
        { records },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          },
        }
      );
      return { message: response.data.message, data: response.data.data };
    } catch (error) {
      return rejectWithValue(mapApiError(error));
    }
  }
);

// "Borrar día" — gated in the UI behind an on-palette confirm step.
export const deleteAttendanceDay = createAsyncThunk<
  { message: string; dayId: number },
  number,
  { rejectValue: string }
>(
  'attendance/deleteAttendanceDay',
  async (dayId, { rejectWithValue }) => {
    try {
      const response = await attendanceAPI.delete(`/day/${dayId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });
      return { message: response.data.message, dayId };
    } catch (error) {
      return rejectWithValue(mapApiError(error));
    }
  }
);

// Alumno AsistenciaCard — read-only attendance summary for the student's
// own selected enrollment. Ownership is enforced server-side (ALUMNO only
// gets its own enrollment); this thunk just forwards the enrollmentId.
export const fetchMyAttendance = createAsyncThunk<
  { message: string; data: AttendanceEnrollmentView },
  number,
  { rejectValue: string }
>(
  'attendance/fetchMyAttendance',
  async (enrollmentId, { rejectWithValue }) => {
    try {
      const response = await attendanceAPI.get(`/enrollment/${enrollmentId}`, {
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

// Métricas view — count + % per student.
export const fetchAttendanceMetrics = createAsyncThunk<
  { message: string; data: AttendanceMetricRow[] },
  number,
  { rejectValue: string }
>(
  'attendance/fetchAttendanceMetrics',
  async (sectionId, { rejectWithValue }) => {
    try {
      const response = await attendanceAPI.get(`/metrics/section/${sectionId}`, {
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
