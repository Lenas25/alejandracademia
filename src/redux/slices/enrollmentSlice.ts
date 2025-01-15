


import { createSlice } from "@reduxjs/toolkit";
import { Enrollment } from "@/types/enrollment";
import { fetchEnrollment, fetchEnrollmentByUser, finishEnrollment, updateEnrollment } from "../service/enrollmentService";

const enrollmentSlice = createSlice({
  name: "enrollment",
  initialState:
  {
    enrollmentView: null as Enrollment | null,
    enrollmentsUser: [] as Enrollment[],
    enrollments: [] as Enrollment[],
    studentsEnrollment: [] as Enrollment[],
    message: null as string | null,
    status: 'idle',
  },
  reducers: {
    setEnrollmentsUser: (state, action) => {
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
    builder.addCase(fetchEnrollmentByUser.fulfilled, (state, action) => {
     state.enrollmentsUser = action.payload;
    });
  }
});

export const enrollmentSliceReducer = enrollmentSlice.reducer;

export const { setEnrollmentsUser } = enrollmentSlice.actions;
