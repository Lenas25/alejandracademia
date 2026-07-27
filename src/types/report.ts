// Types for `GET /grade/report/:id` (`:id` = SECTION id). Mirrors the
// BackSpa response shape exactly (see engram sdd/pdf-report/apply-progress
// — GradeService.reportBySection). Feeds the client-side "Constancia de
// Calificaciones" PDF export (PLAN_FEATURES 4.4). Read-only report data —
// no create/update payload types needed here.

export interface ReportSection {
  id: number;
  name: string;
  courseName: string;
}

export interface ReportActivity {
  id: number;
  name: string;
  percentage: number;
}

export interface ReportGrade {
  activityId: number;
  grade: number | null;
}

export interface ReportStudent {
  enrollmentId: number;
  dni: string;
  fullName: string;
  active: boolean;
  grades: ReportGrade[];
  // Weighted average over graded activities only, 2 decimals; null when
  // nothing has been graded yet.
  average: number | null;
}

export interface SectionReport {
  section: ReportSection;
  activities: ReportActivity[];
  students: ReportStudent[];
}
