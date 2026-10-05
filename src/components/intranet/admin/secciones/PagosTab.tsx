"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { useToast } from "@/components/intranet/ui/Toast";
import {
  fetchSectionInstallments,
  payInstallment,
  setSectionInstallmentDueDate,
  unmarkInstallment,
} from "@/redux/service/paymentService";
import { Section } from "@/types/section";
import { IconSearch } from "@tabler/icons-react";
import { useDebounce } from "@/hooks/useDebounce";
import TabHeader from "./TabHeader";
import { DueDatesPanel } from "./PagosDueDates";
import PagosStudentRow, {
  StudentGroup,
  StudentStats,
} from "./PagosStudentRow";

interface PagosTabProps {
  selectedSection: Section;
}

type StudentFilter = "all" | "pending" | "overdue" | "upToDate";

const PAGE_SIZE = 25;

// Local "YYYY-MM-DD" (string compare against dueDate; never `new Date(dueDate)`).
function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const FILTERS: { key: StudentFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Con pendientes" },
  { key: "overdue", label: "Con vencidas" },
  { key: "upToDate", label: "Al día" },
];

// Admin Pagos Tab (spec: "Section Detail Pagos Tab" requirement; design's
// Frontend Architecture — sdd/pagos/design). Fetches the flat per-section
// installment list once and groups it client-side by `enrollmentId` into a
// per-student accordion — no wide table, so it stacks cleanly at 390px
// (standing responsive rule). Inline Registrar/Editar/Desmarcar forms per
// installment, refetch-on-mutation, toast feedback with
// the real backend reason via extractErrorMessage (thunk layer). Due dates
// are a per-section-per-cuota setting (product change) — set once per
// installment number in the "Vencimientos por cuota" panel above the
// student list; the per-student rows only display the due date + status
// badge read-only.
function PagosTab({ selectedSection }: PagosTabProps) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const sectionInstallments = useAppSelector(
    (state) => state.payment.sectionInstallments,
  );
  const paymentStatus = useAppSelector((state) => state.payment.status);
  const loadErrorMessage = useAppSelector(
    (state) => state.payment.errorMessage,
  );

  const [expandedEnrollmentId, setExpandedEnrollmentId] = useState<
    number | null
  >(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filter, setFilter] = useState<StudentFilter>("all");
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const debouncedSearch = useDebounce(searchTerm, 250);

  useEffect(() => {
    if (selectedSection?.id) {
      dispatch(fetchSectionInstallments(selectedSection.id));
    }
  }, [dispatch, selectedSection?.id]);

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

  // Per-student stats, computed once per data change (not per render).
  const studentStats = useMemo<StudentStats[]>(() => {
    const today = todayISO();
    return studentGroups.map((group) => {
      let paidCount = 0;
      let overdue = false;
      let owed = 0;
      let paidSum = 0;
      for (const i of group.installments) {
        if (i.status === "cancelado") {
          paidCount += 1;
          if (i.amount != null) paidSum += i.amount;
        } else {
          if (i.status === "atrasado" || (i.dueDate && i.dueDate < today)) {
            overdue = true;
          }
          if (i.amount != null) owed += i.amount;
        }
      }
      const total = group.installments.length;
      return {
        group,
        paidCount,
        total,
        overdue,
        pending: paidCount < total,
        owed,
        paidSum,
      };
    });
  }, [studentGroups]);

  const filterCounts = useMemo(
    () => ({
      all: studentStats.length,
      pending: studentStats.filter((s) => s.pending).length,
      overdue: studentStats.filter((s) => s.overdue).length,
      upToDate: studentStats.filter((s) => !s.overdue).length,
    }),
    [studentStats],
  );

  const filteredStats = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return studentStats.filter((s) => {
      if (term && !s.group.studentName.toLowerCase().includes(term)) {
        return false;
      }
      if (filter === "pending") return s.pending;
      if (filter === "overdue") return s.overdue;
      if (filter === "upToDate") return !s.overdue;
      return true;
    });
  }, [studentStats, debouncedSearch, filter]);

  // Reset pagination whenever the result set definition changes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch, filter, selectedSection?.id]);

  const visibleStats = useMemo(
    () => filteredStats.slice(0, visibleCount),
    [filteredStats, visibleCount],
  );

  const sectionId = selectedSection?.id;

  const refetch = useCallback(() => {
    if (sectionId) {
      dispatch(fetchSectionInstallments(sectionId));
    }
  }, [dispatch, sectionId]);

  const handleToggle = useCallback((enrollmentId: number) => {
    setExpandedEnrollmentId((prev) =>
      prev === enrollmentId ? null : enrollmentId,
    );
  }, []);

  const handleInvalidForm = useCallback(() => {
    toast.error("Ingresa un monto mayor a 0 y una fecha válida");
  }, [toast]);

  const handlePay = useCallback(
    async (installmentId: number, amount: number, paidDate: string) => {
      const resultAction = await dispatch(
        payInstallment({ id: installmentId, data: { amount, paidDate } }),
      );
      if (payInstallment.fulfilled.match(resultAction)) {
        toast.success(
          resultAction.payload.message || "Cuota registrada correctamente",
        );
        refetch();
        return true;
      }
      toast.error(resultAction.payload ?? "No se pudo registrar la cuota");
      return false;
    },
    [dispatch, refetch, toast],
  );

  const handleUnmark = useCallback(
    async (installmentId: number) => {
      const resultAction = await dispatch(unmarkInstallment(installmentId));
      if (unmarkInstallment.fulfilled.match(resultAction)) {
        toast.success(
          resultAction.payload.message || "Cuota revertida a pendiente",
        );
        refetch();
      } else {
        toast.error(resultAction.payload ?? "No se pudo revertir la cuota");
      }
    },
    [dispatch, refetch, toast],
  );

  // Admin sets/clears a cuota's due date at the SECTION level (applies to
  // every student's installment N). The thunk resolves with the full updated
  // section row list and paymentSlice replaces `sectionInstallments` with it,
  // so no refetch is needed here.
  const handleCuotaDueDateCommit = useCallback(
    async (installmentNumber: number, dueDate: string | null) => {
      if (!sectionId) return false;
      const resultAction = await dispatch(
        setSectionInstallmentDueDate({ sectionId, installmentNumber, dueDate }),
      );
      if (setSectionInstallmentDueDate.fulfilled.match(resultAction)) {
        toast.success(
          resultAction.payload.message || "Fecha de vencimiento actualizada",
        );
        return true;
      }
      toast.error(
        resultAction.payload ?? "No se pudo actualizar la fecha de vencimiento",
      );
      return false;
    },
    [dispatch, sectionId, toast],
  );

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

      {cuotaDueDates.length > 0 && (
        <DueDatesPanel
          items={cuotaDueDates}
          onCommit={handleCuotaDueDateCommit}
        />
      )}

      {paymentStatus === "loading" && sectionInstallments.length > 0 && (
        <p role="status" className="text-xs text-gray-500">
          Actualizando…
        </p>
      )}

      {studentGroups.length > 0 && (
        <div className="sticky top-16 md:top-0 z-10 -mx-1 flex flex-col gap-3 border-b border-grey bg-white/95 px-1 py-2 backdrop-blur">
          <div className="relative">
            <label htmlFor="pagos-search" className="sr-only">
              Buscar estudiante
            </label>
            <IconSearch
              aria-hidden
              size={20}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              id="pagos-search"
              type="search"
              aria-label="Buscar estudiante"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar estudiante..."
              className="input input-bordered h-10 w-full bg-white pl-10 text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-darkpink"
            />
          </div>
          <div
            role="group"
            aria-label="Filtrar estudiantes"
            className="flex flex-wrap gap-2"
          >
            {FILTERS.map(({ key, label }) => {
              const active = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(key)}
                  className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-darkpink ${
                    active
                      ? "border-darkpink bg-darkpink text-white"
                      : "border-grey bg-white text-black hover:bg-lightpink/40"
                  }`}
                >
                  {label}
                  <span
                    className={`rounded-full px-2 text-xs ${
                      active ? "bg-white/20" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {filterCounts[key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {paymentStatus === "loading" && sectionInstallments.length === 0 ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-lg text-darkpink" />
        </div>
      ) : studentGroups.length === 0 ? (
        <p className="text-center py-10 text-gray-400">
          No hay estudiantes matriculados en esta sección
        </p>
      ) : filteredStats.length === 0 ? (
        <p className="text-center py-10 text-gray-400">
          No se encontraron estudiantes
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleStats.map((stats) => (
            <PagosStudentRow
              key={stats.group.enrollmentId}
              stats={stats}
              isExpanded={expandedEnrollmentId === stats.group.enrollmentId}
              onToggle={handleToggle}
              onPay={handlePay}
              onUnmark={handleUnmark}
              onInvalidForm={handleInvalidForm}
            />
          ))}
          {filteredStats.length > visibleCount && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="btn h-10 min-h-10 w-full bg-white text-black border border-grey hover:bg-lightpink/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-darkpink"
            >
              Mostrar más ({filteredStats.length - visibleCount} restantes)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default PagosTab;
