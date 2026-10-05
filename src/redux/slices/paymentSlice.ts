import { createSlice } from "@reduxjs/toolkit";
import { Payment, PaymentSectionRow } from "@/types/payment";
import {
  fetchMyInstallments,
  fetchSectionInstallments,
  payInstallment,
  setSectionInstallmentDueDate,
  unmarkInstallment,
} from "../service/paymentService";

const paymentSlice = createSlice({
  name: "payments",
  initialState:
    {
      // Admin Pagos tab: flat list, grouped by `enrollmentId` in the component.
      sectionInstallments: [] as PaymentSectionRow[],
      // Section the `sectionInstallments` list belongs to (guards against stale
      // lists / out-of-order responses after switching sections).
      sectionInstallmentsSectionId: null as number | null,
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
    .addCase(fetchSectionInstallments.pending, (state, action) => {
      state.status = 'loading';
      // Switching sections: drop the previous section's rows. A refetch of the
      // same section keeps them so the list does not flash away.
      if (state.sectionInstallmentsSectionId !== action.meta.arg) {
        state.sectionInstallments = [];
        state.sectionInstallmentsSectionId = action.meta.arg;
      }
      state.errorMessage = null;
    })
    .addCase(fetchSectionInstallments.fulfilled, (state, action) => {
      // Ignore a late response for a section that is no longer the current one.
      if (state.sectionInstallmentsSectionId !== action.meta.arg) return;
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
    builder.addCase(setSectionInstallmentDueDate.fulfilled, (state, action) => {
      state.message = action.payload.message;
      // Ignore the payload if it is for a section other than the loaded one.
      if (action.meta.arg.sectionId !== state.sectionInstallmentsSectionId) return;
      // The endpoint returns the full updated section row list: replace it so
      // the Pagos tab needs no refetch after each due-date edit.
      if (Array.isArray(action.payload.data)) {
        state.sectionInstallments = action.payload.data;
      }
    });
  }
});

export const paymentSliceReducer = paymentSlice.reducer;
