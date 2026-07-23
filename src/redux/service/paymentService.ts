import rutas from "@/utils/endpoints";
import { extractErrorMessage } from "@/utils/extractErrorMessage";
import { Payment, PaymentSectionRow, RegisterPaymentPayload } from "@/types/payment";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const paymentAPI = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}${rutas.payment}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Section Detail Pagos Tab (spec: "payment-management" domain) — admin
// grid data source. Mirrors `GET /payment/section/:id` exactly: a flat list
// of every installment across every enrollment in the section, grouped
// client-side by `enrollmentId` into the PagosTab's per-student accordion
// (design's Frontend Architecture).
export const fetchSectionInstallments = createAsyncThunk<
  { message: string; data: PaymentSectionRow[] },
  number,
  { rejectValue: string }
>(
  'payments/fetchSectionInstallments',
  async (sectionId, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.get(`/section/${sectionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });
      return { message: response.data.message, data: response.data.data };
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// Alumno Read-Only Mis Cuotas (spec: "student-payments-view" domain).
// Scoped to a single enrollment — matches the existing `NotasCard` /
// `gradeByEnrollment` convention (`enrollmentView.id`), also usable by
// admin to read one specific enrollment's installments.
export const fetchMyInstallments = createAsyncThunk<
  { message: string; data: Payment[] },
  number,
  { rejectValue: string }
>(
  'payments/fetchMyInstallments',
  async (enrollmentId, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.get(`/enrollment/${enrollmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });
      return { message: response.data.message, data: response.data.data };
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// Admin Payment Registration + Admin Payment Correction (spec:
// "payment-management" domain). Single endpoint covers both per design's
// "Pay vs unmark API" ADR — there is no separate "edit" thunk, the same
// `pay()` backend method handles a pending row (registration) or an
// already-paid row (correction) identically.
export const payInstallment = createAsyncThunk<
  { message: string; data: Payment },
  { id: number; data: RegisterPaymentPayload },
  { rejectValue: string }
>(
  'payments/payInstallment',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.patch(`/${id}`, data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });
      return { message: response.data.message, data: response.data.data };
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

// Admin Payment Correction — "Revert to pending" scenario (spec:
// "payment-management" domain).
export const unmarkInstallment = createAsyncThunk<
  { message: string; data: Payment },
  number,
  { rejectValue: string }
>(
  'payments/unmarkInstallment',
  async (id, { rejectWithValue }) => {
    try {
      const response = await paymentAPI.patch(`/${id}/unmark`, undefined, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });
      return { message: response.data.message, data: response.data.data };
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);
