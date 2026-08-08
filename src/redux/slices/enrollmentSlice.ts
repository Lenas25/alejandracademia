


import { createSlice } from "@reduxjs/toolkit";
import { Enrollment } from "@/types/enrollment";
import { fetchEnrollment, fetchEnrollmentByUser, finishEnrollment, reopenEnrollment, updateEnrollment } from "../service/enrollmentService";

const enrollmentSlice = createSlice({
  name: "enrollment",
  initialState:
  {
    enrollmentView: null as Enrollment | null,
    enrollmentsUser: [] as Enrollment[],
    enrollments: [] as Enrollment[],
    studentsEnrollment: [] as Enrollment[],
    message: null as string | null,
    // Load-failure reason for `fetchEnrollmentByUser` (kept separate from
    // `message`, which carries mutation success feedback) — mirrors
    // paymentSlice's `errorMessage` convention.
    errorMessage: null as string | null,
    status: 'idle',
  },
  reducers: {
    // Renamed from `setEnrollmentsUser` for clarity — this reducer sets the
    // single *selected* enrollment (`enrollmentView`), not the plural
    // `enrollmentsUser` list (that's populated by `fetchEnrollmentByUser`
    // below). Behavior is unchanged; only the name now matches what it does.
    setSelectedEnrollment: (state, action) => {
      state.enrollmentView = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnrollment.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchEnrollment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.enrollments = action.payload;
      });
    builder.addCase(updateEnrollment.fulfilled, (state, action) => {
      state.message = action.payload.message;
    });
    builder.addCase(finishEnrollment.fulfilled, (state, action) => {
      state.message = action.payload.message;
    });
    builder.addCase(reopenEnrollment.fulfilled, (state, action) => {
      state.message = action.payload.message;
    });
    builder
      // Without pending/rejected here, `status` stayed 'idle' forever for a
      // zero-enrollment student — CursoCard's skeleton branch (keyed on
      // 'idle') never resolved to the "Sin cursos activos" empty state, and
      // a failed fetch was silent.
      .addCase(fetchEnrollmentByUser.pending, (state) => {
        state.status = 'loading';
        state.errorMessage = null;
        // Clear stale list — admin detail and alumno panel share this slice,
        // so without this the previous student's enrollments flash while loading.
        state.enrollmentsUser = [];
      })
      .addCase(fetchEnrollmentByUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.enrollmentsUser = action.payload;
        state.errorMessage = null;
      })
      .addCase(fetchEnrollmentByUser.rejected, (state, action) => {
        state.status = 'failed';
        // `fetchEnrollmentByUser` isn't typed with an explicit `rejectValue`
        // (unlike paymentService's thunks), so `action.payload` isn't
        // narrowed to `string` — cast rather than retype the thunk itself.
        state.errorMessage = (action.payload as string | undefined) ?? "No se pudieron cargar tus cursos";
      });
  }
});

export const enrollmentSliceReducer = enrollmentSlice.reducer;

export const { setSelectedEnrollment } = enrollmentSlice.actions;
