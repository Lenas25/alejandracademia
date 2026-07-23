import { createSlice } from "@reduxjs/toolkit";
import { Payment, PaymentSectionRow } from "@/types/payment";
import {
  fetchMyInstallments,
  fetchSectionInstallments,
  payInstallment,
  unmarkInstallment,
} from "../service/paymentService";

const paymentSlice = createSlice({
  name: "payments",
  initialState:
    {
      // Admin Pagos tab: flat list, grouped by `enrollmentId` in the component.
      sectionInstallments: [] as PaymentSectionRow[],
      // Alumno CuotasCard: read-only, single enrollment.
      myInstallments: [] as Payment[],
      message: null as string | null,
      // Load-failure reason for the two fetch thunks (kept separate from
      // `message`, which carries mutation success feedback) — surfaces the
      // real backend/network reason via extractErrorMessage so the UI can
      // distinguish "load failed" from "genuinely no data" instead of
      // falling through to a misleading empty state (verify-report WARNING).
      errorMessage: null as string | null,
      status: 'idle' as 'idle' | 'loading' | 'succeeded' | 'failed',
    },
  reducers: {
  },
  extraReducers: (builder) => {
    builder
    .addCase(fetchSectionInstallments.pending, (state) => {
      state.status = 'loading';
      state.errorMessage = null;
    })
    .addCase(fetchSectionInstallments.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.sectionInstallments = action.payload.data;
      state.errorMessage = null;
    })
    .addCase(fetchSectionInstallments.rejected, (state, action) => {
      state.status = 'failed';
      state.errorMessage = action.payload ?? "No se pudieron cargar las cuotas";
    })
    builder
    .addCase(fetchMyInstallments.pending, (state) => {
      state.status = 'loading';
      state.errorMessage = null;
    })
    .addCase(fetchMyInstallments.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.myInstallments = action.payload.data;
      state.errorMessage = null;
    })
    .addCase(fetchMyInstallments.rejected, (state, action) => {
      state.status = 'failed';
      state.errorMessage = action.payload ?? "No se pudieron cargar las cuotas";
    })
    builder.addCase(payInstallment.fulfilled, (state, action) => {
      state.message = action.payload.message;
    });
    builder.addCase(unmarkInstallment.fulfilled, (state, action) => {
      state.message = action.payload.message;
    });
  }
});

export const paymentSliceReducer = paymentSlice.reducer;
