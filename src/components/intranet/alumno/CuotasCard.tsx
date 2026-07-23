"use client";

import { fetchMyInstallments } from "@/redux/service/paymentService";
import { useAppDispatch, useAppSelector } from "@/redux/stores";
import { IconCoin, IconReceipt2 } from "@tabler/icons-react";
import { useEffect } from "react";

// Alumno Read-Only Mis Cuotas (spec: "student-payments-view" domain).
// Follows `NotasCard`'s conventions exactly (card shell, spinner, icon
// empty state) and its same current-enrollment scoping idiom
// (`enrollmentView.id` → `fetchMyInstallments`, mirroring
// `gradeByEnrollment`). Read-only: no edit controls are rendered.
export function CuotasCard() {
  const dispatch = useAppDispatch();
  const enrollmentView = useAppSelector((state) => state.enrollment.enrollmentView);
  const myInstallments = useAppSelector((state) => state.payment.myInstallments);
  const paymentStatus = useAppSelector((state) => state.payment?.status);

  useEffect(() => {
    if (enrollmentView) {
      dispatch(fetchMyInstallments(enrollmentView.id));
    }
  }, [dispatch, enrollmentView]);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-700">Mis Cuotas</h3>
        <IconReceipt2 size={24} className="text-gray-400" />
      </div>
      <div className="flex-grow flex flex-col gap-3 overflow-y-auto pr-2">
        {paymentStatus === 'loading' ? (
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner text-gray-300"></span>
          </div>
        ) : myInstallments.length > 0 ? (
          myInstallments.map((installment) => (
            <div key={installment.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg gap-3">
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-800">Cuota {installment.installmentNumber}</h4>
                <p className="text-sm text-gray-500">
                  {installment.amount != null ? `S/ ${installment.amount.toFixed(2)}` : "Monto pendiente"}
                  {installment.paidDate ? ` · ${installment.paidDate}` : ""}
                </p>
              </div>
              <span
                className={`badge badge-ghost badge-sm text-white shrink-0 ${
                  installment.status === "cancelado" ? "badge-success" : "badge-neutral"
                }`}>
                {installment.status}
              </span>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
            <IconCoin size={40} className="text-gray-200" />
            <div>
              <p className="font-medium text-gray-500">Sin cuotas registradas</p>
              <p className="text-sm text-gray-400 mt-1">Tus cuotas aparecerán aquí cuando estén disponibles.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
