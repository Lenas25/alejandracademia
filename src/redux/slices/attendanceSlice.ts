import { createSlice } from "@reduxjs/toolkit";
import { AttendanceDayDetail, AttendanceDaySummary, AttendanceEnrollmentView, AttendanceMetricRow } from "@/types/attendance";
import {
  createAttendanceDay,
  deleteAttendanceDay,
  fetchAttendanceDay,
  fetchAttendanceDays,
  fetchAttendanceMetrics,
  fetchMyAttendance,
  updateAttendanceDay,
} from "../service/attendanceService";

const attendanceSlice = createSlice({
  name: "attendance",
  initialState: {
    // Registro tab: the section's day list.
    days: [] as AttendanceDaySummary[],
    // Currently expanded accordion day's full roster (one at a time).
    dayDetail: null as AttendanceDayDetail | null,
    // Métricas tab.
    metrics: [] as AttendanceMetricRow[],
    // Shared list-load status for `days`/`metrics` — mirrors paymentSlice's
    // single-status convention (the two list fetches never overlap in the
    // UI since Registro/Métricas are mutually exclusive view modes).
    status: 'idle' as 'idle' | 'loading' | 'succeeded' | 'failed',
    message: null as string | null,
    // Alumno AsistenciaCard: read-only summary for the student's own
    // selected enrollment. Kept on its own status/error (mirrors
    // gradeSlice's `errorMessage` split) so it never collides with the
    // admin Registro/Métricas status above.
    myAttendance: null as AttendanceEnrollmentView | null,
    myAttendanceStatus: 'idle' as 'idle' | 'loading' | 'succeeded' | 'failed',
    myAttendanceError: null as string | null,
  },
  reducers: {
    clearAttendanceDayDetail: (state) => {
      state.dayDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendanceDays.pending, (state) => {
        state.status = 'loading';
        state.message = null;
      })
      .addCase(fetchAttendanceDays.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.days = action.payload.data;
      })
      .addCase(fetchAttendanceDays.rejected, (state, action) => {
        // Aborted = superseded by a newer request; it owns the status now.
        if (action.meta.aborted) return;
        state.status = 'failed';
        state.message = action.payload ?? "No se pudieron cargar los días de asistencia";
      });

    builder
      .addCase(fetchAttendanceMetrics.pending, (state) => {
        state.status = 'loading';
        state.message = null;
      })
      .addCase(fetchAttendanceMetrics.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.metrics = action.payload.data;
      })
      .addCase(fetchAttendanceMetrics.rejected, (state, action) => {
        state.status = 'failed';
        state.message = action.payload ?? "No se pudieron cargar las métricas de asistencia";
      });

    builder
      .addCase(fetchAttendanceDay.fulfilled, (state, action) => {
        state.dayDetail = action.payload.data;
      })
      .addCase(fetchAttendanceDay.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.message = action.payload ?? "No se pudo cargar el día de asistencia";
      });

    builder.addCase(createAttendanceDay.fulfilled, (state, action) => {
      state.message = action.payload.message;
    });

    builder.addCase(updateAttendanceDay.fulfilled, (state, action) => {
      // `days` (presentCount/totalCount badges) is refreshed by an explicit
      // `fetchAttendanceDays` refetch in AsistenciaTab after a successful
      // save — kept here to a single source of truth instead of also
      // patching the list from this response.
      state.message = action.payload.message;
      state.dayDetail = action.payload.data;
    });

    builder.addCase(deleteAttendanceDay.fulfilled, (state, action) => {
      state.message = action.payload.message;
      state.days = state.days.filter((day) => day.id !== action.payload.dayId);
      if (state.dayDetail?.id === action.payload.dayId) {
        state.dayDetail = null;
      }
    });

    builder
      // Clear the previous course's attendance on switch — otherwise
      // AsistenciaCard renders stale cross-course data until the new fetch
      // resolves (or forever if it fails). Same stale-data class already
      // fixed for grades in `gradeByEnrollment.pending`.
      .addCase(fetchMyAttendance.pending, (state) => {
        state.myAttendanceStatus = 'loading';
        state.myAttendance = null;
        state.myAttendanceError = null;
      })
      .addCase(fetchMyAttendance.fulfilled, (state, action) => {
        state.myAttendanceStatus = 'succeeded';
        state.myAttendance = action.payload.data;
        state.myAttendanceError = null;
      })
      .addCase(fetchMyAttendance.rejected, (state, action) => {
        state.myAttendanceStatus = 'failed';
        state.myAttendanceError = action.payload ?? "No se pudo cargar la asistencia";
      });
  }
});

export const { clearAttendanceDayDetail } = attendanceSlice.actions;
export const attendanceSliceReducer = attendanceSlice.reducer;
