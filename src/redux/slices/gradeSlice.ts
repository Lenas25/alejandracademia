
import { createSlice } from "@reduxjs/toolkit";
import { fetchGrade, gradeByEnrollment, updateGrade } from "../service/gradeService";
import { Grade, GradeUsers } from "@/types/grade";

const gradeSlice = createSlice({
  name: "grades",
  initialState:
    {
      gradesUser: [] as GradeUsers[],
      grades:  [] as Grade[],
      message: null as string | null,
      // Load-failure reason for `gradeByEnrollment` (kept separate from
      // `message`, which carries mutation success feedback) — mirrors
      // paymentSlice's `errorMessage` convention.
      errorMessage: null as string | null,
      status: 'idle' as 'idle' | 'loading' | 'succeeded' | 'failed',
    },
  reducers: {
  },
  extraReducers: (builder) => {
    builder
    .addCase(fetchGrade.pending, (state) => {
      state.status = 'loading';
    })
    .addCase(fetchGrade.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.grades = action.payload.data;
      state.message = action.payload.message;
    })
    .addCase(fetchGrade.rejected, (state) => {
      state.status = 'failed';
    })
    builder.addCase(updateGrade.fulfilled, (state, action) => {
      state.message = action.payload.message;
    });
    builder
      // Clear the previous course's grades on switch — otherwise
      // SummaryTiles/NotasCard/CursoCard render stale cross-course data
      // until the new fetch resolves (or forever if it fails).
      .addCase(gradeByEnrollment.pending, (state) => {
        state.status = 'loading';
        state.gradesUser = [];
        state.errorMessage = null;
      })
      .addCase(gradeByEnrollment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.gradesUser = action.payload.data;
        state.message = action.payload.message;
        state.errorMessage = null;
      })
      .addCase(gradeByEnrollment.rejected, (state, action) => {
        state.status = 'failed';
        // `gradeByEnrollment` isn't typed with an explicit `rejectValue`
        // (unlike paymentService's thunks), so `action.payload` isn't
        // narrowed to `string` — cast rather than retype the thunk itself.
        state.errorMessage = (action.payload as string | undefined) ?? "No se pudieron cargar las notas";
      });
  }
});

export const gradeSliceReducer = gradeSlice.reducer;
