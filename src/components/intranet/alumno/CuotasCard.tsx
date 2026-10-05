"use client";

import { fetchMyInstallments } from "@/redux/service/paymentService";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { Payment } from "@/types/payment";
import {
  IconAlertTriangle,
  IconCheck,
  IconChevronDown,
  IconCircleCheck,
  IconCoin,
  IconConfetti,
  IconReceipt2,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { usePagedList } from "../ui/usePagedList";
import { ShowMore } from "../ui/ShowMore";
import { compareByDueDate, getInstallmentState, InstallmentState, todayKey } from "./summaryHelpers";

const PAGE_SIZE = 12;

// Display-only "YYYY-MM-DD" -> "DD/MM/YYYY" formatter (string split, never
// `new Date(...)` — see src/types/payment.ts on the timezone-corruption bug).
function formatDateDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.slice(0, 10).split("-");
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

function formatAmount(amount: number | null): string {
  return amount != null ? amount.toFixed(2) : "Por definir";
}

function StateChip({ state, paidDate }: { state: InstallmentState; paidDate: string | null }) {
  if (state === "paid") {
    return (
      <span className="inline-flex flex-col items-end">
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
          <IconCheck size={12} aria-hidden />
          Pagada
        </span>
        {paidDate && <span className="mt-0.5 text-[11px] text-gray-500">{formatDateDisplay(paidDate)}</span>}
      </span>
    );
  }
  if (state === "overdue") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 whitespace-nowrap">
        <IconAlertTriangle size={12} aria-hidden />
        Vencida
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 whitespace-nowrap">
      Pendiente
    </span>
  );
}

const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5";

function InstallmentRow({
  p,
  state,
  highlight,
}: {
  p: Payment;
  state: InstallmentState;
  highlight: boolean;
}) {
  return (
    <li
      className={`${ROW_GRID} min-h-12 px-3 py-2 rounded-lg ${
        highlight
          ? "bg-lightpink/40 ring-1 ring-darkpink/40"
          : state === "overdue"
            ? "bg-red-50/60"
            : "bg-gray-50"
      }`}>
      <span className="font-semibold text-gray-800 break-words min-w-0 text-sm">
        Cuota {p.installmentNumber}
        {highlight && <span className="ml-2 text-xs font-medium text-darkpink">Próxima</span>}
      </span>
      {/* Chip sits in column 2 on mobile (row-span 2), column 4 on sm+ */}
      <span className="row-span-2 sm:row-span-1 sm:col-start-4 sm:row-start-1 justify-self-end">
        <StateChip state={state} paidDate={p.paidDate} />
      </span>
      <div className="flex flex-wrap gap-x-3 sm:contents">
        <span className="text-xs sm:text-sm text-gray-500 sm:col-start-2 sm:row-start-1">
          <span className="sm:hidden">Vence: </span>
          {p.dueDate ? formatDateDisplay(p.dueDate) : "Sin fecha"}
        </span>
        <span className="text-xs sm:text-sm font-medium text-gray-700 sm:col-start-3 sm:row-start-1">
          {formatAmount(p.amount)}
        </span>
      </div>
    </li>
  );
}

function ListHeader() {
  return (
    <div
      className={`hidden sm:grid ${ROW_GRID} px-3 text-xs font-medium uppercase tracking-wide text-gray-500`}
      aria-hidden>
      <span>Cuota</span>
      <span>Vence</span>
      <span>Monto</span>
      <span className="justify-self-end">Estado</span>
    </div>
  );
}

// Alumno read-only "Mis Cuotas". Same enrollment-scoping idiom as before
// (`enrollmentView.id` -> `fetchMyInstallments`). No edit controls.
export function CuotasCard() {
  const dispatch = useAppDispatch();
  const enrollmentView = useAppSelector((state) => state.enrollment.enrollmentView);
  const myInstallments = useAppSelector((state) => state.payment.myInstallments);
  const paymentStatus = useAppSelector((state) => state.payment?.status);
  const loadErrorMessage = useAppSelector((state) => state.payment?.errorMessage);
  const [paidOpenOverride, setPaidOpenOverride] = useState<boolean | null>(null);

  useEffect(() => {
    if (enrollmentView) {
      dispatch(fetchMyInstallments(enrollmentView.id));
    }
  }, [dispatch, enrollmentView]);

  useEffect(() => {
    setPaidOpenOverride(null);
  }, [enrollmentView?.id]);

  const { overdue, pending, paid, nextId } = useMemo(() => {
    const today = todayKey();
    const o: Payment[] = [];
    const pe: Payment[] = [];
    const pa: Payment[] = [];
    for (const p of myInstallments) {
      const s = getInstallmentState(p, today);
      (s === "paid" ? pa : s === "overdue" ? o : pe).push(p);
    }
    o.sort(compareByDueDate);
    pe.sort(compareByDueDate);
    pa.sort((a, b) => a.installmentNumber - b.installmentNumber);
    return { overdue: o, pending: pe, paid: pa, nextId: pe[0]?.id ?? null };
  }, [myInstallments]);

  const unpaid = useMemo(() => [...overdue, ...pending], [overdue, pending]);
  const unpaidPaged = usePagedList(unpaid, PAGE_SIZE, String(enrollmentView?.id ?? ""));
  const paidPaged = usePagedList(paid, PAGE_SIZE, String(enrollmentView?.id ?? ""));

  const paidOpen = paidOpenOverride ?? unpaid.length === 0;
  const allPaid = myInstallments.length > 0 && unpaid.length === 0;
  const next = pending[0];
  const overdueIds = useMemo(() => new Set(overdue.map((p) => p.id)), [overdue]);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 flex flex-col h-full overflow-x-clip">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-700">Mis Cuotas</h3>
        <IconReceipt2 size={24} className="text-gray-400 shrink-0" />
      </div>
      <div className="flex-grow flex flex-col gap-3">
        {paymentStatus === "loading" ? (
          <div className="flex justify-center items-center h-full py-8">
            <span className="loading loading-spinner text-gray-300"></span>
          </div>
        ) : paymentStatus === "failed" ? (
          // Checked before the empty state so a fetch failure is never read
          // as "you have no installments".
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
            <div role="alert" className="alert alert-error text-white">
              <span>{loadErrorMessage || "No se pudieron cargar las cuotas"}</span>
            </div>
            <button
              type="button"
              onClick={() => enrollmentView && dispatch(fetchMyInstallments(enrollmentView.id))}
              className="btn btn-sm h-10 min-h-10 bg-darkpink text-white border-none hover:bg-black">
              Reintentar
            </button>
          </div>
        ) : myInstallments.length > 0 ? (
          <>
            {overdue.length > 0 ? (
              <div
                role="status"
                className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
                <IconAlertTriangle size={20} className="shrink-0" aria-hidden />
                <p className="text-sm font-medium">
                  {overdue.length === 1
                    ? "Tienes 1 cuota vencida"
                    : `Tienes ${overdue.length} cuotas vencidas`}
                </p>
              </div>
            ) : next ? (
              <div className="flex items-center gap-2 rounded-lg border border-darkpink/30 bg-lightpink/40 p-3 text-gray-800">
                <IconCoin size={20} className="shrink-0 text-darkpink" aria-hidden />
                <p className="text-sm font-medium break-words min-w-0">
                  Próxima cuota: Cuota {next.installmentNumber}
                  {next.amount != null && ` · ${formatAmount(next.amount)}`}
                  {next.dueDate && ` · vence ${formatDateDisplay(next.dueDate)}`}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-emerald-700">
                <IconConfetti size={20} className="shrink-0" aria-hidden />
                <p className="text-sm font-medium">Estás al día</p>
              </div>
            )}

            {unpaid.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <ListHeader />
                <ul className="flex flex-col gap-1.5">
                  {unpaidPaged.visible.map((p) => (
                    <InstallmentRow
                      key={p.id}
                      p={p}
                      state={overdueIds.has(p.id) ? "overdue" : "pending"}
                      highlight={p.id === nextId && overdue.length === 0}
                    />
                  ))}
                </ul>
                {unpaidPaged.total > PAGE_SIZE && (
                  <ShowMore
                    className="mt-2"
                    shown={unpaidPaged.shown}
                    total={unpaidPaged.total}
                    remaining={unpaidPaged.remaining}
                    onClick={unpaidPaged.showMore}
                  />
                )}
              </div>
            )}

            {paid.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  aria-expanded={paidOpen}
                  onClick={() => setPaidOpenOverride(!paidOpen)}
                  className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-darkpink">
                  <span className="inline-flex items-center gap-2">
                    <IconCircleCheck size={18} className="text-emerald-600" aria-hidden />
                    Pagadas ({paid.length})
                  </span>
                  <IconChevronDown
                    size={18}
                    aria-hidden
                    className={`text-gray-400 transition-transform ${paidOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {paidOpen && (
                  <>
                    {unpaid.length === 0 && <ListHeader />}
                    <ul className="flex flex-col gap-1.5">
                      {paidPaged.visible.map((p) => (
                        <InstallmentRow key={p.id} p={p} state="paid" highlight={false} />
                      ))}
                    </ul>
                    {paidPaged.total > PAGE_SIZE && (
                      <ShowMore
                        className="mt-2"
                        shown={paidPaged.shown}
                        total={paidPaged.total}
                        remaining={paidPaged.remaining}
                        onClick={paidPaged.showMore}
                      />
                    )}
                  </>
                )}
              </div>
            )}
            {allPaid && <span className="sr-only">Todas tus cuotas están pagadas</span>}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
            <IconCoin size={40} className="text-gray-200" />
            <div>
              <p className="font-medium text-gray-500">Sin cuotas registradas</p>
              <p className="text-sm text-gray-500 mt-1">Tus cuotas aparecerán aquí cuando estén disponibles.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
