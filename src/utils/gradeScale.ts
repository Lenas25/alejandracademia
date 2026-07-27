// Business rule (client, 2026-07-27): on the 0-20 scale, a grade of 15 or
// higher is a pass; 14 or below is a fail. Single source of truth for the
// student-facing "Aprobado / Desaprobado" verdicts in the alumno intranet.
//
// Note: the Constancia de Calificaciones PDF uses its OWN admin-configurable
// `minApproving` (stored in institution config) instead of this constant, so
// an academy can print a different threshold on the official document. The
// alumno panel can't read that config (its endpoint is admin/tutor only), so
// the student verdict relies on this fixed business constant.
export const PASSING_GRADE = 15;
