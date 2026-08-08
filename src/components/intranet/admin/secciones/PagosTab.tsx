"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import {
  fetchSectionInstallments,
  payInstallment,
  setSectionInstallmentDueDate,
  unmarkInstallment,
} from "@/redux/service/paymentService";
import { Section } from "@/types/section";
import { PaymentSectionRow } from "@/types/payment";
import {
  IconCash,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { normalizeLeadingZero } from "@/utils/numberInput";
import { useDebounce } from "@/hooks/useDebounce";
import { PaymentStatusBadge } from "@/components/shared/PaymentStatusBadge";
import TabHeader from "./TabHeader";

// Display-only "YYYY-MM-DD" -> "DD/MM/YYYY" formatter (string split, never
// `new Date(...)` — see src/types/payment.ts comment on the
// timezone-corruption bugfix). Mirrors the local helper already used in
// AsistenciaTab.tsx / AsistenciaCard.tsx.
function formatDateDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

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
// the real backend reason via extractErrorMessage (thunk layer). Due dates
// are a per-section-per-cuota setting (product change) — set once per
// installment number in the "Vencimientos por cuota" panel above the
// student list; the per-student rows only display the due date + status
// badge read-only.
function PagosTab({ selectedSection }: PagosTabProps) {
  const dispatch = useAppDispatch();
  const sectionInstallments = useAppSelector(
    (state) => state.payment.sectionInstallments,
  );
  const paymentStatus = useAppSelector((state) => state.payment.status);
  const loadErrorMessage = useAppSelector(
    (state) => state.payment.errorMessage,
  );

  const [message, setMessage] = useState<string>("");
  const [expandedEnrollmentId, setExpandedEnrollmentId] = useState<
    number | null
  >(null);
  const [editingInstallmentId, setEditingInstallmentId] = useState<
    number | null
  >(null);
  const [formAmount, setFormAmount] = useState<string>("");
  const [formDate, setFormDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearch = useDebounce(searchTerm, 300);

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

  // Section-level "Vencimientos por cuota" editor data (product change:
  // due date is a per-section-per-installment-number setting, not a
  // per-student one). Distinct installment numbers, sorted ascending, each
  // prefilled from any row sharing that number — the backend contract
  // guarantees every student's row for a given installment number carries
  // the same `dueDate`.
  const cuotaDueDates = useMemo(() => {
    const map = new Map<number, string | null>();
    for (const row of sectionInstallments) {
      if (!map.has(row.installmentNumber)) {
        map.set(row.installmentNumber, row.dueDate);
      }
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([installmentNumber, dueDate]) => ({ installmentNumber, dueDate }));
  }, [sectionInstallments]);

  const filteredGroups = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    return studentGroups.filter((group) =>
      group.studentName.toLowerCase().includes(term),
    );
  }, [studentGroups, debouncedSearch]);

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
    if (
      !formAmount ||
      Number.isNaN(amountValue) ||
      amountValue <= 0 ||
      !formDate
    ) {
      setMessage("Error: ingresa un monto mayor a 0 y una fecha válida");
      return;
    }
    const resultAction = await dispatch(
      payInstallment({
        id: installmentId,
        data: { amount: amountValue, paidDate: formDate },
      }),
    );
    if (payInstallment.fulfilled.match(resultAction)) {
      setMessage(
        resultAction.payload.message || "Cuota registrada correctamente",
      );
      cancelEdit();
      refetch();
    } else {
      setMessage(
        `Error: ${resultAction.payload ?? "no se pudo registrar la cuota"}`,
      );
    }
  };

  const handleUnmark = async (installmentId: number) => {
    const resultAction = await dispatch(unmarkInstallment(installmentId));
    if (unmarkInstallment.fulfilled.match(resultAction)) {
      setMessage(resultAction.payload.message || "Cuota revertida a pendiente");
      refetch();
    } else {
      setMessage(
        `Error: ${resultAction.payload ?? "no se pudo revertir la cuota"}`,
      );
    }
  };

  // Admin sets/clears a cuota's due date at the SECTION level (product
  // change: applies to every student's installment N in this section, not
  // a single student's row — client business rule, sdd/pagos due-date
  // slice). `<input type="date">` already yields "YYYY-MM-DD" (or "" when
  // cleared), passed straight to the thunk.
  const handleCuotaDueDateChange = async (
    installmentNumber: number,
    value: string,
  ) => {
    if (!selectedSection?.id) return;
    const dueDate = value === "" ? null : value;
    const resultAction = await dispatch(
      setSectionInstallmentDueDate({
        sectionId: selectedSection.id,
        installmentNumber,
        dueDate,
      }),
    );
    if (setSectionInstallmentDueDate.fulfilled.match(resultAction)) {
      setMessage(
        resultAction.payload.message || "Fecha de vencimiento actualizada",
      );
      refetch();
    } else {
      setMessage(
        `Error: ${resultAction.payload ?? "no se pudo actualizar la fecha de vencimiento"}`,
      );
    }
  };

  // Load-Failure State (verify-report WARNING) — checked before the
  // null-count empty state so a fetch failure is never masked as "this
  // section has no installments configured". Distinct from
  // studentGroups.length === 0 (a succeeded fetch that legitimately
  // returned zero rows).
  if (paymentStatus === "failed") {
    return (
      <div className="flex flex-col gap-5">
        <TabHeader title="Pagos" />
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="alert alert-error text-white max-w-md">
            <span>
              {loadErrorMessage || "No se pudieron cargar las cuotas"}
            </span>
          </div>
          <button
            type="button"
            onClick={refetch}
            className="btn btn-sm bg-darkpink text-white border-none hover:bg-black"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Null-Count Empty State (spec: "payment-management" domain).
  if (!selectedSection.installmentsCount) {
    return (
      <div className="flex flex-col gap-5">
        <TabHeader title="Pagos" />
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <p className="font-medium text-gray-500">
            Esta sección no tiene cuotas configuradas
          </p>
          <p className="text-sm text-gray-400">
            Edita la sección y define la cantidad de cuotas para habilitar los
            pagos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <TabHeader title="Pagos" />

      {message && (
        <div
          className={`alert ${message.includes("Error") ? "alert-error" : "alert-success"} text-white`}
        >
          {message}
        </div>
      )}

      {cuotaDueDates.length > 0 && (
        <div className="rounded-lg border border-grey bg-white p-3 flex flex-col gap-3">
          <h3 className="font-medium text-black">Vencimientos por cuota</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {cuotaDueDates.map(({ installmentNumber, dueDate }) => (
              <label
                key={installmentNumber}
                className="flex items-center justify-between gap-2 rounded-md border border-grey bg-white px-3 py-2"
              >
                <span className="text-sm font-medium text-black shrink-0">
                  Cuota {installmentNumber}
                </span>
                <input
                  type="date"
                  value={dueDate ?? ""}
                  onChange={(e) =>
                    handleCuotaDueDateChange(installmentNumber, e.target.value)
                  }
                  className="input input-bordered input-sm min-w-0 flex-1 bg-white text-black [color-scheme:light]"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {studentGroups.length > 0 && (
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar estudiante..."
            className="input input-bordered w-full bg-white text-black"
          />
          <IconSearch className="absolute right-3 top-2 text-gray-400" />
        </div>
      )}

      {paymentStatus === "loading" ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-lg text-darkpink" />
        </div>
      ) : studentGroups.length === 0 ? (
        <p className="text-center py-10 text-gray-400">
          No hay estudiantes matriculados en esta sección
        </p>
      ) : filteredGroups.length === 0 ? (
        <p className="text-center py-10 text-gray-400">
          No se encontraron estudiantes
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredGroups.map((group) => {
            const paidCount = group.installments.filter(
              (i) => i.status === "cancelado",
            ).length;
            const allPaid =
              group.installments.length > 0 &&
              paidCount === group.installments.length;
            const isExpanded = expandedEnrollmentId === group.enrollmentId;
            return (
              <div
                key={group.enrollmentId}
                className="border border-grey rounded-lg overflow-hidden bg-white"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedEnrollmentId(
                      isExpanded ? null : group.enrollmentId,
                    )
                  }
                  className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 bg-white hover:bg-lightpink/40 transition-colors text-left"
                >
                  {/* Stacked on mobile (name row, then badges row) so a long
                      name never gets squeezed against the `shrink-0` badges
                      group down to a near-zero width — that squeeze was
                      rendering names one letter per line. `truncate` (needs
                      `min-w-0` on a flex child) caps a single very long name
                      instead of letting it wrap. */}
                  <span className="font-medium text-black min-w-0 truncate">
                    {group.studentName}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap sm:justify-end shrink-0">
                    <span className="badge badge-outline">
                      {paidCount}/{group.installments.length} pagadas
                    </span>
                    {allPaid && (
                      <span className="badge badge-sm gap-1 font-medium border bg-emerald-50 text-emerald-700 border-emerald-300 whitespace-nowrap">
                        Pagos completados
                      </span>
                    )}
                    {isExpanded ? (
                      <IconChevronUp size={18} />
                    ) : (
                      <IconChevronDown size={18} />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="flex flex-col divide-y">
                    {group.installments.map((installment) => (
                      <div
                        key={installment.id}
                        className="p-3 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              Cuota {installment.installmentNumber}
                            </span>
                            <PaymentStatusBadge status={installment.status} />
                          </div>
                          <div className="text-sm text-gray-500 text-right">
                            {installment.amount != null
                              ? `${installment.amount.toFixed(2)}`
                              : "—"}
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
                                onChange={(e) =>
                                  setFormAmount(
                                    normalizeLeadingZero(e.target.value),
                                  )
                                }
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
                                className="btn btn-sm bg-darkpink text-white border-none hover:bg-black"
                              >
                                Guardar
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="btn btn-sm btn-ghost bg-white text-black"
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
                              className="btn btn-sm btn-ghost bg-white text-black hover:bg-darkpink hover:text-white"
                            >
                              <IconCash size={16} />{" "}
                              {installment.status === "cancelado"
                                ? "Editar"
                                : "Registrar"}
                            </button>
                            {installment.status === "cancelado" && (
                              <button
                                type="button"
                                onClick={() => handleUnmark(installment.id)}
                                className="btn btn-sm btn-ghost bg-white text-black hover:bg-error hover:text-white"
                              >
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
