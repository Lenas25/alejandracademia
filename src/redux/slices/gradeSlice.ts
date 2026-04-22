
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
    builder.addCase(gradeByEnrollment.fulfilled, (state, action) => {
      state.gradesUser = action.payload.data;
      state.message = action.payload.message;
    });
  }
});

export const gradeSliceReducer = gradeSlice.reducer;
