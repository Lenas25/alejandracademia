"use client";

import { useAppSelector } from "@/redux/stores";
import { calculateWeightedAverage } from "@/utils/gradeAverage";
import { PASSING_GRADE } from "@/utils/gradeScale";
import { formatShortDate, getInstallmentState, getNextPending, roundGrade, todayKey } from "./summaryHelpers";
import {
  IconCalendarCheck,
  IconChartBar,
  IconChecklist,
  IconReceipt2,
  TablerIcon,
} from "@tabler/icons-react";
import { ReactNode } from "react";

type LoadState = "loading" | "error" | "ready";

interface TileProps {
  icon: TablerIcon;
  label: string;
  state: LoadState;
  value: ReactNode;
  caption?: ReactNode;
  chip?: ReactNode;
}

function Tile({ icon: Icon, label, state, value, caption, chip }: TileProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-4 flex flex-col gap-1 min-w-0 overflow-x-clip">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs sm:text-sm font-medium text-gray-500 truncate">{label}</span>
        <Icon size={20} className="text-gray-400 shrink-0" aria-hidden />
      </div>
      {state === "loading" ? (
        <div className="animate-pulse space-y-2 pt-1" aria-busy="true">
          <div className="h-8 w-20 rounded bg-gray-200" />
          <div className="h-3 w-28 max-w-full rounded bg-gray-100" />
        </div>
      ) : state === "error" ? (
        <>
          <span className="text-2xl sm:text-3xl font-bold text-gray-500" title="No se pudo cargar">
            —
          </span>
          <span className="text-xs text-gray-500">No disponible</span>
        </>
      ) : (
        <>
          <span className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight">{value}</span>
          {chip}
          {caption ? <span className="text-xs text-gray-500 break-words">{caption}</span> : null}
        </>
      )}
    </div>
  );
}

function Chip({ tone, children }: { tone: "good" | "bad" | "neutral"; children: ReactNode }) {
  const styles = {
    good: "bg-lightpink text-darkpink",
    bad: "bg-red-50 text-red-600",
    neutral: "bg-gray-100 text-gray-500",
  }[tone];
  return (
    <span
      className={`self-start rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>
      {children}
    </span>
  );
}

// KPI row for the selected enrollment. Purely derived from the Redux state
// that NotasCard / AsistenciaCard / CuotasCard / CursoCard already populate
// (all of them stay mounted — see PanelContent), so this component issues no
// requests of its own.
export function SummaryTiles() {
  const enrollmentView = useAppSelector((state) => state.enrollment.enrollmentView);
  const gradesUser = useAppSelector((state) => state.grade.gradesUser);
  const gradeStatus = useAppSelector((state) => state.grade.status);
  const activities = useAppSelector((state) => state.activity.activities);
  const activityStatus = useAppSelector((state) => state.activity.status);
  const myAttendance = useAppSelector((state) => state.attendance.myAttendance);
  const attendanceStatus = useAppSelector((state) => state.attendance.myAttendanceStatus);
  const myInstallments = useAppSelector((state) => state.payment.myInstallments);
  const paymentStatus = useAppSelector((state) => state.payment?.status);

  const isFinished = enrollmentView?.active === false;

  // --- Promedio ---
  // Status is computed from the same 1-decimal value that is displayed, so
  // 14.96 shows "15.0" together with the passing state.
  const rawAverage = calculateWeightedAverage(gradesUser);
  const average = rawAverage === null ? null : roundGrade(rawAverage, 1);
  const isPassing = average !== null && average >= PASSING_GRADE;
  const gradeState: LoadState =
    gradeStatus === "failed" ? "error" : gradeStatus === "loading" || gradeStatus === "idle" ? "loading" : "ready";
  const gradeChip =
    average === null ? (
      <Chip tone="neutral">Sin notas aún</Chip>
    ) : isFinished ? (
      <Chip tone={isPassing ? "good" : "bad"}>{isPassing ? "Aprobado" : "Desaprobado"}</Chip>
    ) : (
      <Chip tone={isPassing ? "good" : "bad"}>{isPassing ? "Aprobando" : "Por debajo del mínimo"}</Chip>
    );

  // --- Asistencia ---
  const attendanceState: LoadState =
    attendanceStatus === "failed"
      ? "error"
      : attendanceStatus === "loading" || attendanceStatus === "idle"
        ? "loading"
        : "ready";
  const hasAttendance = myAttendance !== null && myAttendance.totalDays > 0;

  // --- Cuotas ---
  const paymentState: LoadState =
    paymentStatus === "failed" ? "error" : paymentStatus === "loading" || paymentStatus === "idle" ? "loading" : "ready";
  const today = todayKey();
  const paidCount = myInstallments.filter((i) => getInstallmentState(i, today) === "paid").length;
  const overdueCount = myInstallments.filter((i) => getInstallmentState(i, today) === "overdue").length;
  const hasOverdue = overdueCount > 0;
  const next = getNextPending(myInstallments, today);
  const allPaid = myInstallments.length > 0 && paidCount === myInstallments.length;

  // --- Actividades ---
  // `activities` is only fetched by CursoCard; gate on its own status as well.
  const totalActivities = activities.length;
  const activityState: LoadState =
    gradeState === "error" || activityStatus === "failed"
      ? "error"
      : gradeState === "loading" || activityStatus === "loading" || activityStatus === "idle"
        ? "loading"
        : "ready";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Tile
        icon={IconChartBar}
        label="Promedio"
        state={gradeState}
        value={average === null ? "—" : average.toFixed(1)}
        chip={gradeChip}
        caption={`Mínimo para aprobar: ${PASSING_GRADE}`}
      />
      <Tile
        icon={IconCalendarCheck}
        label="Asistencia"
        state={attendanceState}
        value={hasAttendance ? `${myAttendance!.percentage}%` : "—"}
        caption={
          hasAttendance
            ? `${myAttendance!.presentDays}/${myAttendance!.totalDays} días`
            : "Sin asistencia aún"
        }
      />
      <Tile
        icon={IconReceipt2}
        label="Cuotas pagadas"
        state={paymentState}
        value={myInstallments.length > 0 ? `${paidCount}/${myInstallments.length}` : "—"}
        chip={
          myInstallments.length === 0 ? undefined : hasOverdue ? (
            <Chip tone="bad">Con cuotas vencidas</Chip>
          ) : (
            <Chip tone="good">Al día</Chip>
          )
        }
        caption={
          myInstallments.length === 0
            ? "Sin cuotas registradas"
            : allPaid
              ? "Todo pagado"
              : next
                ? `Próxima: Cuota ${next.installmentNumber}${
                    next.amount != null ? ` · ${next.amount.toFixed(2)}` : ""
                  }${next.dueDate ? ` · vence ${formatShortDate(next.dueDate)}` : ""}`
                : undefined
        }
      />
      <Tile
        icon={IconChecklist}
        label="Actividades"
        state={activityState}
        value={totalActivities > 0 ? `${gradesUser.length}/${totalActivities}` : "—"}
        caption={totalActivities > 0 ? "calificadas" : "Sin actividades"}
      />
    </div>
  );
}
