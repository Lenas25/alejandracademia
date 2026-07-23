// Payment: mirrors BackSpa `src/payment/payment.service.ts`'s `PaymentView`
// exactly (sdd/pagos verify-report, PR1-PR4 backend slice, PASS verdict).
// `status` is NEVER sent by the client — it is derived server-side from
// `paidDate` in `PaymentService.toView()` (design ADR "Status: derived from
// paidDate" — sdd/pagos/design). `amount` is always a JS number or null
// (bugfix, verify-report WARNING — backend normalizes numeric-column string
// hydration in `toView()`). `paidDate` is always a "YYYY-MM-DD" string or
// null, never a `Date` (bugfix, verify-report CRITICAL — see backend
// `payment.entity.ts` comment for the full timezone-corruption root cause;
// constructing `new Date(paidDate)` client-side for anything other than
// display formatting would reintroduce the same class of bug).
export type PaymentStatus = "pendiente" | "cancelado";

export interface Payment {
  id: number;
  installmentNumber: number;
  amount: number | null;
  paidDate: string | null;
  status: PaymentStatus;
}

// Mirrors `PaymentSectionRow` (`payment.service.ts`) — the flat, per-
// installment row returned by `GET /payment/section/:id`, grouped
// client-side by `enrollmentId` into the PagosTab's per-student accordion
// (design's Frontend Architecture).
export interface PaymentSectionRow extends Payment {
  enrollmentId: number;
  studentId: string | undefined;
  studentName: string;
}

// Mirrors `RegisterPaymentDto` (`dto/register-payment.dto.ts`) exactly:
// `amount` > 0 with up to 2 decimal places, `paidDate` a valid ISO 8601
// date-only string. Used by both the register (pending row) and correction
// (already-paid row) flows — the backend's single `pay()` method covers
// both (design ADR "Pay vs unmark API").
export interface RegisterPaymentPayload {
  amount: number;
  paidDate: string;
}
