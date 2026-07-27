// Backend-driven configuration for the "Constancia de Calificaciones" PDF
// export (PLAN_FEATURES 4.4 polish). Mirrors `GET/PATCH /institution-config`
// exactly (admin+tutor read, admin-only write). Replaces the previously
// hardcoded `constanciaConfig.ts` static object — the shape here is the
// single source of truth for both the admin configurator page and the PDF
// generator (`generateConstanciaPdf.ts`).
export interface InstitutionConfig {
  id: number;
  academyName: string;
  // Extra institution lines rendered centered above the title, first line
  // bold (e.g. legal/registration lines). Includes the academy name itself
  // as one of the lines — the PDF header renders ALL of them, in order.
  headerLines: string[];
  signatoryName: string;
  signatoryTitle: string;
  // City used in the closing line ("expedida en {city}, el DD de mes de YYYY").
  city: string;
  // Small contact line printed at the bottom of every page.
  contactFooter: string;
  // Grading-scale explanation shown under the table. Keep in sync with
  // `minApproving` below.
  gradeScaleText: string;
  // Minimum passing grade, used to compute approvedLabel / failedLabel.
  minApproving: number;
  approvedLabel: string;
  failedLabel: string;
}
