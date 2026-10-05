import type { Payment } from "@/types/payment";

// "YYYY-MM-DD" -> "DD/MM". String split only; never `new Date()` (UTC
// parsing renders a day early in Peru).
export function formatShortDate(value: string): string {
  const [, month, day] = value.slice(0, 10).split("-");
  return month && day ? `${day}/${month}` : value;
}

export type InstallmentState = "paid" | "overdue" | "pending";

// Local "today" as YYYY-MM-DD. Built from local calendar parts so it can be
// compared lexicographically with the backend's date-only strings.
export function todayKey(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${mm}-${dd}`;
}

// paid: status "cancelado" (derived server-side from paidDate).
// overdue: unpaid and (server flagged "atrasado" OR dueDate < today).
// Single source of truth for CuotasCard and SummaryTiles.
export function getInstallmentState(
  inst: Pick<Payment, "status" | "dueDate">,
  today: string,
): InstallmentState {
  if (inst.status === "cancelado") return "paid";
  if (inst.status === "atrasado" || (inst.dueDate && inst.dueDate.slice(0, 10) < today)) return "overdue";
  return "pending";
}

// Soonest due first; null due dates sort last, ties broken by number.
export function compareByDueDate(
  a: Pick<Payment, "dueDate" | "installmentNumber">,
  b: Pick<Payment, "dueDate" | "installmentNumber">,
): number {
  const da = a.dueDate ?? "9999-99-99";
  const db = b.dueDate ?? "9999-99-99";
  return da === db ? a.installmentNumber - b.installmentNumber : da < db ? -1 : 1;
}

// First PENDING (unpaid and not overdue) installment by due date.
export function getNextPending<T extends Pick<Payment, "status" | "dueDate" | "installmentNumber">>(
  installments: T[],
  today: string = todayKey(),
): T | undefined {
  return installments
    .filter((i) => getInstallmentState(i, today) === "pending")
    .sort(compareByDueDate)[0];
}

// Round a 0-20 grade to the decimals that are displayed, so the status
// (passing / colour) is always computed from the value the user actually sees.
export function roundGrade(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

const MONTH_SHORT_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// "YYYY-MM-DD..." -> "DD mmm YYYY" (string split, no `new Date()`).
export function formatLongDate(value: Date | string | undefined | null): string | null {
  if (!value) return null;
  const [year, month, day] = String(value).slice(0, 10).split("-");
  const label = MONTH_SHORT_ES[Number(month) - 1];
  return year && day && label ? `${day} ${label} ${year}` : null;
}
