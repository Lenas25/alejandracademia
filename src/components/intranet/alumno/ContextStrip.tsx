"use client";

import { useAppSelector } from "@/redux/stores";
import { IconCalendarEvent, IconCoin } from "@tabler/icons-react";

const MONTH_SHORT_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

// `section.initialDate`/`endDate` are date-only strings (YYYY-MM-DD...) at
// runtime. Routing them through `new Date(value)` parses as UTC midnight,
// which renders a day earlier in Peru (UTC-5) — the anti-pattern this
// codebase avoids (see SectionForm's `slice(0, 10)` convention and
// AsistenciaTab's `formatDateDisplay`). Format by plain string manipulation
// instead, never via `new Date()`.
function formatDate(value: Date | string | undefined | null): string | null {
  if (!value) return null;
  const [year, month, day] = String(value).slice(0, 10).split("-");
  if (!year || !month || !day) return null;
  const monthLabel = MONTH_SHORT_ES[Number(month) - 1];
  if (!monthLabel) return null;
  return `${day} ${monthLabel} ${year}`;
}

// Replaces the old decorative, data-less week strip (`Calendario.tsx`) with
// a compact, data-bound context strip for the selected enrollment: the
// section's start/end dates and the next pending installment. Reuses
// `state.payment.myInstallments`, already fetched by CuotasCard for the
// same enrollment — no separate fetch here. Intentionally compact so it
// never pushes real data (Promedio, Notas) below the fold on mobile.
export function ContextStrip() {
  const enrollmentView = useAppSelector((state) => state.enrollment.enrollmentView);
  const myInstallments = useAppSelector((state) => state.payment.myInstallments);
  const paymentStatus = useAppSelector((state) => state.payment?.status);

  if (!enrollmentView) return null;

  const section = enrollmentView.section;
  const startDate = formatDate(section?.initialDate);
  const endDate = formatDate(section?.endDate);

  const nextInstallment = [...myInstallments]
    .filter((installment) => installment.status === "pendiente")
    .sort((a, b) => a.installmentNumber - b.installmentNumber)[0];

  return (
    <div className="bg-white rounded-2xl shadow-sm px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <IconCalendarEvent size={18} className="text-darkpink shrink-0" />
          <span className="text-gray-500 shrink-0">Duración:</span>
          <span className="font-medium text-gray-800 truncate">
            {startDate && endDate ? `${startDate} – ${endDate}` : "Fechas no disponibles"}
          </span>
        </div>
        <div className="hidden sm:block w-px h-4 bg-grey" />
        <div className="flex items-center gap-2 min-w-0">
          <IconCoin size={18} className="text-yellow shrink-0" />
          <span className="text-gray-500 shrink-0">Próxima cuota:</span>
          <span className="font-medium text-gray-800 truncate">
            {paymentStatus === "loading"
              ? "Cargando..."
              : nextInstallment
                ? `Cuota ${nextInstallment.installmentNumber}${
                    nextInstallment.amount != null ? ` · S/ ${nextInstallment.amount.toFixed(2)}` : ""
                  }`
                : "Sin cuotas pendientes"}
          </span>
        </div>
      </div>
    </div>
  );
}
