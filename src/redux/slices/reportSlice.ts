import { createSlice } from "@reduxjs/toolkit";
import { SectionReport } from "@/types/report";
import { fetchSectionReport } from "../service/reportService";

// Minimal slice for the Constancia de Calificaciones report (PLAN_FEATURES
// 4.4). NotasTab consumes the dispatch result directly (unwraps
// `fetchSectionReport.fulfilled` like PagosTab does with `payInstallment`),
// but the slice still exists so `data`/`status`/`errorMessage` are
// inspectable from devtools and reusable by other components later —
// mirrors paymentSlice's shape.
const reportSlice = createSlice({
  name: "report",
  initialState: {
    data: null as SectionReport | null,
    errorMessage: null as string | null,
    status: 'idle' as 'idle' | 'loading' | 'succeeded' | 'failed',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSectionReport.pending, (state) => {
        state.status = 'loading';
        state.errorMessage = null;
      })
      .addCase(fetchSectionReport.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload.data;
        state.errorMessage = null;
      })
      .addCase(fetchSectionReport.rejected, (state, action) => {
        state.status = 'failed';
        state.errorMessage = action.payload ?? "No se pudo generar la constancia";
      });
  }
});

export const reportSliceReducer = reportSlice.reducer;
