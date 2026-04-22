
import { createSlice } from "@reduxjs/toolkit";
import { Course } from "@/types/course";
import { createCourse, deleteCourse, fetchCourses, updateCourse } from "../service/courseService";

const courseSlice = createSlice({
  name: "courses",
  initialState:
    {
      courses:  [] as Course[],
      message: null as string | null,
      status: 'idle' as 'idle' | 'loading' | 'succeeded' | 'failed',
    },
  reducers: {
  },
  extraReducers: (builder) => {
    builder
    .addCase(fetchCourses.pending, (state) => {
      state.status = 'loading';
    })
    .addCase(fetchCourses.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.courses = action.payload.data;
    })
    .addCase(fetchCourses.rejected, (state) => {
      state.status = 'failed';
    })
    builder.addCase(createCourse.fulfilled, (state, action) => {
      state.message = action.payload.message;
    });
    builder.addCase(updateCourse.fulfilled, (state, action) => {
      state.message = action.payload.message;
    });
    builder.addCase(deleteCourse.fulfilled, (state, action) => {
      state.message = action.payload.message;
    });
  }
});

export const courseSliceReducer = courseSlice.reducer;
