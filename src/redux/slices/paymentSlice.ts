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
      status: 'idle' as 'idle' | 'loading' | 'succeeded' | 'failed',
    },
  reducers: {
  },
  extraReducers: (builder) => {
    builder
    .addCase(fetchSectionInstallments.pending, (state) => {
      state.status = 'loading';
    })
    .addCase(fetchSectionInstallments.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.sectionInstallments = action.payload.data;
    })
    .addCase(fetchSectionInstallments.rejected, (state) => {
      state.status = 'failed';
    })
    builder
    .addCase(fetchMyInstallments.pending, (state) => {
      state.status = 'loading';
    })
    .addCase(fetchMyInstallments.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.myInstallments = action.payload.data;
    })
    .addCase(fetchMyInstallments.rejected, (state) => {
      state.status = 'failed';
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
