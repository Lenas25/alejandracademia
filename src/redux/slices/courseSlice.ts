
import { createSlice } from "@reduxjs/toolkit";
import { Course } from "@/types/course";
import { createCourse, deleteCourse, fetchCourses, updateCourse } from "../service/courseService";

const courseSlice = createSlice({
  name: "courses",
  initialState: 
    {
      courses:  [] as Course[],
      message: null as string | null,
    },
  reducers: {
  },
  extraReducers: (builder) => {
    builder
    .addCase(fetchCourses.fulfilled, (state, action) => {
      state.courses = action.payload.data;
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
