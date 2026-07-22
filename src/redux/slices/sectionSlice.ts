
import { createSlice } from "@reduxjs/toolkit";
import { Section } from "@/types/section";
import {
  createSection,
  deleteSection,
  fetchSectionById,
  fetchSections,
  updateSection,
} from "../service/sectionService";

const sectionSlice = createSlice({
  name: "sections",
  initialState:
    {
      sections: [] as Section[],
      sectionView: null as Section | null,
      message: null as string | null,
      status: 'idle' as 'idle' | 'loading' | 'succeeded' | 'failed',
    },
  reducers: {
  },
  extraReducers: (builder) => {
    builder
    .addCase(fetchSections.pending, (state) => {
      state.status = 'loading';
    })
    .addCase(fetchSections.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.sections = action.payload.data;
    })
    .addCase(fetchSections.rejected, (state) => {
      state.status = 'failed';
    })
    builder.addCase(fetchSectionById.fulfilled, (state, action) => {
      state.sectionView = action.payload.data;
    });
    builder.addCase(createSection.fulfilled, (state, action) => {
      state.message = action.payload.message;
    });
    builder.addCase(updateSection.fulfilled, (state, action) => {
      state.message = action.payload.message;
    });
    builder.addCase(deleteSection.fulfilled, (state, action) => {
      state.message = action.payload.message;
    });
  }
});

export const sectionSliceReducer = sectionSlice.reducer;
