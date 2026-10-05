"use client";

import { fetchMyInstallments } from "@/redux/service/paymentService";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { IconCoin, IconConfetti, IconReceipt2 } from "@tabler/icons-react";
import { PaymentStatusBadge } from "@/components/shared/PaymentStatusBadge";
import { useEffect } from "react";

// Display-only "YYYY-MM-DD" -> "DD/MM/YYYY" formatter (string split, never
// `new Date(...)` — see src/types/payment.ts comment on the
// timezone-corruption bugfix). Mirrors the local helper already used in
// AsistenciaTab.tsx / AsistenciaCard.tsx / PagosTab.tsx.
function formatDateDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

// Alumno Read-Only Mis Cuotas (spec: "student-payments-view" domain).
// Follows `NotasCard`'s conventions exactly (card shell, spinner, icon
// empty state) and its same current-enrollment scoping idiom
// (`enrollmentView.id` → `fetchMyInstallments`, mirroring
// `gradeByEnrollment`). Read-only: no edit controls are rendered.
export function CuotasCard() {
  const dispatch = useAppDispatch();
  const enrollmentView = useAppSelector(
    (state) => state.enrollment.enrollmentView,
  );
  const myInstallments = useAppSelector(
    (state) => state.payment.myInstallments,
  );
  const paymentStatus = useAppSelector((state) => state.payment?.status);
  const loadErrorMessage = useAppSelector(
    (state) => state.payment?.errorMessage,
  );

  useEffect(() => {
    if (enrollmentView) {
      dispatch(fetchMyInstallments(enrollmentView.id));
    }
  }, [dispatch, enrollmentView]);

  const allPaid =
    myInstallments.length > 0 &&
    myInstallments.every((installment) => installment.status === "cancelado");

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-700">Mis Cuotas</h3>
        <IconReceipt2 size={24} className="text-gray-400" />
      </div>
      <div className="flex-grow flex flex-col gap-3 overflow-y-auto pr-2">
        {paymentStatus === "loading" ? (
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner text-gray-300"></span>
          </div>
        ) : paymentStatus === "failed" ? (
          // Load-Failure State (verify-report WARNING) — checked before
          // the "Sin cuotas registradas" empty state so a fetch failure
          // is never read as "you have no installments".
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
            <div role="alert" className="alert alert-error text-white">
              <span>
                {loadErrorMessage || "No se pudieron cargar las cuotas"}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                enrollmentView &&
                dispatch(fetchMyInstallments(enrollmentView.id))
              }
              className="btn btn-sm min-h-10 bg-darkpink text-white border-none hover:bg-black"
            >
              Reintentar
            </button>
          </div>
        ) : myInstallments.length > 0 ? (
          <>
            {allPaid && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-lg p-3">
                <IconConfetti size={20} className="shrink-0" />
                <p className="text-sm font-medium">
                  ¡Completaste todos tus pagos!
                </p>
              </div>
            )}
            {myInstallments.map((installment) => (
              <div
                key={installment.id}
                className="flex justify-between items-start bg-gray-50 p-3 rounded-lg gap-3"
              >
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-800">
                    Cuota {installment.installmentNumber}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {installment.amount != null
                      ? `${installment.amount.toFixed(2)}`
                      : "Monto pendiente"}
                  </p>
                  {installment.dueDate && (
                    <p className="text-xs text-gray-400">
                      Vence: {formatDateDisplay(installment.dueDate)}
                    </p>
                  )}
                  {installment.paidDate && (
                    <p className="text-xs text-gray-400">
                      Pagado: {formatDateDisplay(installment.paidDate)}
                    </p>
                  )}
                </div>
                <PaymentStatusBadge
                  status={installment.status}
                  className="shrink-0"
                />
              </div>
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
            <IconCoin size={40} className="text-gray-200" />
            <div>
              <p className="font-medium text-gray-500">
                Sin cuotas registradas
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Tus cuotas aparecerán aquí cuando estén disponibles.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
