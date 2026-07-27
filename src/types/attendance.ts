// Attendance (Asistencia): mirrors BackSpa `src/attendance/*` exactly
// (sdd/asistencia/apply-progress backend memory, obs #1133). Dates are
// YYYY-MM-DD strings end-to-end — never a `Date` object — same
// timezone-corruption rule already documented on `Payment.paidDate`
// (`src/types/payment.ts`).

// Mirrors `AttendanceDayView` (`attendance.service.ts`) — one row per
// section-detail Registro list item.
export interface AttendanceDaySummary {
  id: number;
  sectionId: number;
  date: string;
  presentCount: number;
  totalCount: number;
}

// Mirrors `AttendanceDayView.roster[]` entry.
export interface AttendanceRosterRow {
  enrollmentId: number;
  studentName: string;
  present: boolean;
}

// Mirrors `AttendanceDayRosterView` (`GET /attendance/day/:dayId`).
export interface AttendanceDayDetail extends AttendanceDaySummary {
  roster: AttendanceRosterRow[];
}

// Mirrors `AttendanceRecordDto` (`dto/attendance-record.dto.ts`) — one
// entry per bulk-toggle sent in `PATCH /attendance/day/:dayId`.
export interface AttendanceRecord {
  enrollmentId: number;
  present: boolean;
}

// Mirrors `AttendanceMetricsRow` (`GET /attendance/metrics/section/:id`).
export interface AttendanceMetricRow {
  enrollmentId: number;
  studentName: string;
  presentDays: number;
  totalDays: number;
  percentage: number;
}

// Alumno AsistenciaCard — mirrors the backend response of
// `GET /attendance/enrollment/:enrollmentId` (ownership enforced
// server-side: ALUMNO only sees its own enrollment). `days` is ascending
// by date; `date` is a raw YYYY-MM-DD string, never a `Date` object (same
// timezone-corruption rule as everywhere else in this file).
export interface AttendanceDayFlag {
  date: string;
  present: boolean;
}

export interface AttendanceEnrollmentView {
  enrollmentId: number;
  studentName: string;
  presentDays: number;
  totalDays: number;
  percentage: number;
  days: AttendanceDayFlag[];
}
