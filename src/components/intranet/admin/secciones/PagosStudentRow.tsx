"use client";

import { memo, useState } from "react";
import { IconCash, IconChevronDown, IconChevronUp, IconX } from "@tabler/icons-react";
import { PaymentSectionRow } from "@/types/payment";
import { normalizeLeadingZero } from "@/utils/numberInput";
import { LoadingButton } from "@/components/intranet/ui/LoadingButton";
import { PaymentStatusBadge } from "@/components/shared/PaymentStatusBadge";
import { useUnsavedChanges } from "@/components/intranet/ui/UnsavedChanges";

export interface StudentGroup {
  enrollmentId: number;
  studentName: string;
  installments: PaymentSectionRow[];
}

export interface StudentStats {
  group: StudentGroup;
  paidCount: number;
  total: number;
  overdue: boolean;
  pending: boolean;
  owed: number;
  paidSum: number;
}

// Display-only "YYYY-MM-DD" -> "DD/MM/YYYY" (string split, never `new Date`).
function formatDateDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

interface PagosStudentRowProps {
  stats: StudentStats;
  isExpanded: boolean;
  onToggle: (enrollmentId: number) => void;
  // Resolve true on success so the row can close its inline form.
  onPay: (installmentId: number, amount: number, paidDate: string) => Promise<boolean>;
  onUnmark: (installmentId: number) => void | Promise<void>;
  onInvalidForm: () => void;
}

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-darkpink";

const PagosStudentRow = memo(function PagosStudentRow({
  stats,
  isExpanded,
  onToggle,
  onPay,
  onUnmark,
  onInvalidForm,
}: PagosStudentRowProps) {
  const { group, paidCount, total, overdue, owed, paidSum } = stats;
  const allPaid = total > 0 && paidCount === total;
  const pct = total > 0 ? Math.round((paidCount / total) * 100) : 0;

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState("");
  // Which installment has a request in flight, so only its buttons spin.
  const [pending, setPending] = useState<{ id: number; kind: "pay" | "unmark" } | null>(null);

  const startEdit = (i: PaymentSectionRow) => {
    setEditingId(i.id);
    setFormAmount(i.amount != null ? String(i.amount) : "");
    setFormDate(i.paidDate ?? "");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setFormAmount("");
    setFormDate("");
  };

  // An open Registrar/Editar form counts as dirty only once its values differ
  // from what startEdit seeded (the installment's stored amount / paid date).
  const editingInstallment =
    editingId !== null
      ? group.installments.find((i) => i.id === editingId)
      : undefined;
  const formDirty =
    !!editingInstallment &&
    (formAmount !== (editingInstallment.amount != null ? String(editingInstallment.amount) : "") ||
      formDate !== (editingInstallment.paidDate ?? ""));
  useUnsavedChanges(`pagos-form-${group.enrollmentId}`, formDirty, "Pagos");

  const submit = async (installmentId: number) => {
    const amountValue = Number(formAmount);
    if (!formAmount || Number.isNaN(amountValue) || amountValue <= 0 || !formDate) {
      onInvalidForm();
      return;
    }
    if (pending) return;
    setPending({ id: installmentId, kind: "pay" });
    try {
      if (await onPay(installmentId, amountValue, formDate)) cancelEdit();
    } finally {
      setPending(null);
    }
  };

  const unmark = async (installmentId: number) => {
    if (pending) return;
    setPending({ id: installmentId, kind: "unmark" });
    try {
      await onUnmark(installmentId);
    } finally {
      setPending(null);
    }
  };

  const panelId = `pagos-student-${group.enrollmentId}`;

  return (
    <div className="border border-grey rounded-lg overflow-x-clip bg-white">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={isExpanded ? panelId : undefined}
        onClick={() => onToggle(group.enrollmentId)}
        className={`w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 min-h-11 bg-white hover:bg-lightpink/40 transition-colors text-left ${focusRing}`}
      >
        <span className="flex w-full items-start justify-between gap-2 sm:w-auto sm:min-w-0 sm:flex-1 sm:justify-start">
          <span
            className="font-medium text-black min-w-0 break-words line-clamp-2"
            title={group.studentName}
          >
            {group.studentName}
          </span>
          <span className="shrink-0 sm:hidden" aria-hidden="true">
            {isExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
          </span>
        </span>
        <span className="flex w-full min-w-0 flex-col gap-1 sm:w-auto sm:shrink-0 sm:items-end">
          <span className="flex items-center gap-2 flex-wrap">
            <span
              role="progressbar"
              aria-valuenow={paidCount}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={`${paidCount} de ${total} cuotas pagadas`}
              className="block h-2 min-w-16 flex-1 rounded-full bg-gray-200 overflow-hidden sm:w-24 sm:flex-none"
            >
              <span
                className={`block h-full ${allPaid ? "bg-emerald-500" : "bg-darkpink"}`}
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className="badge badge-outline whitespace-nowrap">
              {paidCount}/{total} pagadas
            </span>
            {overdue && (
              <span className="badge badge-sm font-medium border bg-red-50 text-red-700 border-red-300 whitespace-nowrap">
                Con vencidas
              </span>
            )}
            {allPaid && (
              <span className="badge badge-sm gap-1 font-medium border bg-emerald-50 text-emerald-700 border-emerald-300 whitespace-nowrap">
                Pagos completados
              </span>
            )}
          </span>
          <span className="flex items-center gap-x-3 gap-y-0.5 flex-wrap text-xs text-gray-500">
            {owed > 0 && <span className="whitespace-nowrap">Por cobrar: {owed.toFixed(2)}</span>}
            {paidSum > 0 && <span className="whitespace-nowrap">Pagado: {paidSum.toFixed(2)}</span>}
            <span className="hidden shrink-0 sm:inline" aria-hidden="true">
              {isExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
            </span>
          </span>
        </span>
      </button>

      {isExpanded && (
        <div id={panelId} className="flex flex-col divide-y">
          {group.installments.map((installment) => (
            <div key={installment.id} className="p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">
                    Cuota {installment.installmentNumber}
                  </span>
                  <PaymentStatusBadge status={installment.status} />
                </div>
                <div className="text-sm text-gray-500 text-right">
                  {installment.amount != null ? `${installment.amount.toFixed(2)}` : "—"}
                  {installment.paidDate
                    ? ` · Pagado: ${formatDateDisplay(installment.paidDate)}`
                    : ""}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                <span>Vencimiento:</span>
                <span className="text-black">
                  {installment.dueDate
                    ? formatDateDisplay(installment.dueDate)
                    : "Sin fecha"}
                </span>
              </div>

              {editingId === installment.id ? (
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
                  <label className="flex flex-col text-xs text-gray-500 flex-1">
                    Monto
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formAmount}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        setFormAmount(normalizeLeadingZero(e.target.value))
                      }
                      className={`input input-bordered h-10 w-full bg-white text-black ${focusRing}`}
                    />
                  </label>
                  <label className="flex flex-col text-xs text-gray-500 flex-1">
                    Fecha de pago
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className={`input input-bordered h-10 w-full bg-white text-black [color-scheme:light] ${focusRing}`}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <LoadingButton
                      type="button"
                      onClick={() => submit(installment.id)}
                      loading={pending?.id === installment.id && pending.kind === "pay"}
                      loadingText="Guardando…"
                      className={`btn h-10 min-h-10 bg-darkpink text-white border-none hover:bg-black ${focusRing}`}
                    >
                      Guardar
                    </LoadingButton>
                    <button
                      type="button"
                      disabled={pending?.id === installment.id}
                      onClick={cancelEdit}
                      className={`btn btn-ghost h-10 min-h-10 bg-white text-black ${focusRing}`}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => startEdit(installment)}
                    className={`btn btn-ghost h-10 min-h-10 bg-white text-black hover:bg-darkpink hover:text-white ${focusRing}`}
                  >
                    <IconCash size={16} />{" "}
                    {installment.status === "cancelado" ? "Editar" : "Registrar"}
                  </button>
                  {installment.status === "cancelado" && (
                    <LoadingButton
                      type="button"
                      onClick={() => unmark(installment.id)}
                      loading={pending?.id === installment.id && pending.kind === "unmark"}
                      loadingText="Desmarcando…"
                      className={`btn btn-ghost h-10 min-h-10 bg-white text-black hover:bg-error hover:text-white ${focusRing}`}
                    >
                      <IconX size={16} /> Desmarcar
                    </LoadingButton>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default PagosStudentRow;
