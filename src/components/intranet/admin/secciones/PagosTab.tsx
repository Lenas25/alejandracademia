"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import {
  fetchSectionInstallments,
  payInstallment,
  unmarkInstallment,
} from "@/redux/service/paymentService";
import { Section } from "@/types/section";
import { PaymentSectionRow } from "@/types/payment";
import { IconCash, IconChevronDown, IconChevronUp, IconX } from "@tabler/icons-react";
import { normalizeLeadingZero } from "@/utils/numberInput";

interface PagosTabProps {
  selectedSection: Section;
}

interface StudentGroup {
  enrollmentId: number;
  studentName: string;
  installments: PaymentSectionRow[];
}

// Admin Pagos Tab (spec: "Section Detail Pagos Tab" requirement; design's
// Frontend Architecture — sdd/pagos/design). Fetches the flat per-section
// installment list once and groups it client-side by `enrollmentId` into a
// per-student accordion — no wide table, so it stacks cleanly at 390px
// (standing responsive rule). Inline Registrar/Editar/Desmarcar forms per
// installment, refetch-on-mutation, alert-error/alert-success feedback with
// the real backend reason via extractErrorMessage (thunk layer).
function PagosTab({ selectedSection }: PagosTabProps) {
  const dispatch = useAppDispatch();
  const sectionInstallments = useAppSelector((state) => state.payment.sectionInstallments);
  const paymentStatus = useAppSelector((state) => state.payment.status);
  const loadErrorMessage = useAppSelector((state) => state.payment.errorMessage);

  const [message, setMessage] = useState<string>("");
  const [expandedEnrollmentId, setExpandedEnrollmentId] = useState<number | null>(null);
  const [editingInstallmentId, setEditingInstallmentId] = useState<number | null>(null);
  const [formAmount, setFormAmount] = useState<string>("");
  const [formDate, setFormDate] = useState<string>("");

  useEffect(() => {
    if (selectedSection?.id) {
      dispatch(fetchSectionInstallments(selectedSection.id));
    }
  }, [dispatch, selectedSection?.id]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const studentGroups = useMemo<StudentGroup[]>(() => {
    const groups = new Map<number, StudentGroup>();
    for (const row of sectionInstallments) {
      const existing = groups.get(row.enrollmentId);
      if (existing) {
        existing.installments.push(row);
      } else {
        groups.set(row.enrollmentId, {
          enrollmentId: row.enrollmentId,
          studentName: row.studentName,
          installments: [row],
        });
      }
    }
    return Array.from(groups.values());
  }, [sectionInstallments]);

  const startEdit = (installment: PaymentSectionRow) => {
    setEditingInstallmentId(installment.id);
    setFormAmount(installment.amount != null ? String(installment.amount) : "");
    setFormDate(installment.paidDate ?? "");
  };

  const cancelEdit = () => {
    setEditingInstallmentId(null);
    setFormAmount("");
    setFormDate("");
  };

  const refetch = () => {
    if (selectedSection?.id) {
      dispatch(fetchSectionInstallments(selectedSection.id));
    }
  };

  const handleSubmitPay = async (installmentId: number) => {
    const amountValue = Number(formAmount);
    if (!formAmount || Number.isNaN(amountValue) || amountValue <= 0 || !formDate) {
      setMessage("Error: ingresa un monto mayor a 0 y una fecha válida");
      return;
    }
    const resultAction = await dispatch(
      payInstallment({ id: installmentId, data: { amount: amountValue, paidDate: formDate } })
    );
    if (payInstallment.fulfilled.match(resultAction)) {
      setMessage(resultAction.payload.message || "Cuota registrada correctamente");
      cancelEdit();
      refetch();
    } else {
      setMessage(`Error: ${resultAction.payload ?? "no se pudo registrar la cuota"}`);
    }
  };

  const handleUnmark = async (installmentId: number) => {
    const resultAction = await dispatch(unmarkInstallment(installmentId));
    if (unmarkInstallment.fulfilled.match(resultAction)) {
      setMessage(resultAction.payload.message || "Cuota revertida a pendiente");
      refetch();
    } else {
      setMessage(`Error: ${resultAction.payload ?? "no se pudo revertir la cuota"}`);
    }
  };

  // Load-Failure State (verify-report WARNING) — checked before the
  // null-count empty state so a fetch failure is never masked as "this
  // section has no installments configured". Distinct from
  // studentGroups.length === 0 (a succeeded fetch that legitimately
  // returned zero rows).
  if (paymentStatus === "failed") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="alert alert-error text-white max-w-md">
          <span>{loadErrorMessage || "No se pudieron cargar las cuotas"}</span>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="btn btn-sm bg-darkpink text-white border-none hover:bg-black">
          Reintentar
        </button>
      </div>
    );
  }

  // Null-Count Empty State (spec: "payment-management" domain).
  if (!selectedSection.installmentsCount) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <p className="font-medium text-gray-500">Esta sección no tiene cuotas configuradas</p>
        <p className="text-sm text-gray-400">
          Edita la sección y define la cantidad de cuotas para habilitar los pagos.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {message && (
        <div className={`alert ${message.includes("Error") ? "alert-error" : "alert-success"} text-white`}>
          {message}
        </div>
      )}

      {paymentStatus === "loading" ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-lg text-darkpink" />
        </div>
      ) : studentGroups.length === 0 ? (
        <p className="text-center py-10 text-gray-400">No hay estudiantes matriculados en esta sección</p>
      ) : (
        <div className="flex flex-col gap-3">
          {studentGroups.map((group) => {
            const paidCount = group.installments.filter((i) => i.status === "cancelado").length;
            const isExpanded = expandedEnrollmentId === group.enrollmentId;
            return (
              <div key={group.enrollmentId} className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedEnrollmentId(isExpanded ? null : group.enrollmentId)}
                  className="w-full flex items-center justify-between gap-3 p-3 bg-gray-50 hover:bg-gray-100 text-left">
                  <span className="font-medium text-gray-800 min-w-0 break-words">{group.studentName}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="badge badge-outline">
                      {paidCount}/{group.installments.length} pagadas
                    </span>
                    {isExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="flex flex-col divide-y">
                    {group.installments.map((installment) => (
                      <div key={installment.id} className="p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Cuota {installment.installmentNumber}</span>
                            <span
                              className={`badge badge-ghost badge-sm text-white ${
                                installment.status === "cancelado" ? "badge-success" : "badge-neutral"
                              }`}>
                              {installment.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {installment.amount != null ? `S/ ${installment.amount.toFixed(2)}` : "—"}
                            {installment.paidDate ? ` · ${installment.paidDate}` : ""}
                          </div>
                        </div>

                        {editingInstallmentId === installment.id ? (
                          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
                            <label className="flex flex-col text-xs text-gray-500 flex-1">
                              Monto
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={formAmount}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setFormAmount(normalizeLeadingZero(e.target.value))}
                                className="input input-bordered input-sm w-full bg-white text-black"
                              />
                            </label>
                            <label className="flex flex-col text-xs text-gray-500 flex-1">
                              Fecha de pago
                              <input
                                type="date"
                                value={formDate}
                                onChange={(e) => setFormDate(e.target.value)}
                                className="input input-bordered input-sm w-full bg-white text-black [color-scheme:light]"
                              />
                            </label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleSubmitPay(installment.id)}
                                className="btn btn-sm bg-darkpink text-white border-none hover:bg-black">
                                Guardar
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="btn btn-sm btn-ghost bg-white text-black">
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => startEdit(installment)}
                              className="btn btn-sm btn-ghost bg-white text-black hover:bg-darkpink hover:text-white">
                              <IconCash size={16} /> {installment.status === "cancelado" ? "Editar" : "Registrar"}
                            </button>
                            {installment.status === "cancelado" && (
                              <button
                                type="button"
                                onClick={() => handleUnmark(installment.id)}
                                className="btn btn-sm btn-ghost bg-white text-black hover:bg-error hover:text-white">
                                <IconX size={16} /> Desmarcar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PagosTab;
