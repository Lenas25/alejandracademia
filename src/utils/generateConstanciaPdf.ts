"use client";

import type { Content, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";
import { SectionReport, ReportStudent } from "@/types/report";
import { InstitutionConfig } from "@/types/institutionConfig";

// Spanish month names for the closing line ("el {DD} de {mes} de {YYYY}").
const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// The academy's brand lockup at `public/brand/nombreLogo2.png` is a
// 3894x721 PNG — a ~5.4:1 wide wordmark+icon, drawn in BLACK on a
// TRANSPARENT background (converted from public/brand/nombreLogo.webp;
// pdfmake decodes only PNG/JPEG, never webp). Black artwork renders
// directly on the PDF's white page, so no background badge is needed.
const LOGO_ASPECT_RATIO = 3894 / 721;
// Sized from a fixed height (not width) because the asset is ~5:1 wide.
// Kept modest so it reads as a top-left letterhead mark on its own line
// above the header text, not a full-width banner.
const LOGO_TARGET_HEIGHT = 32;
const LOGO_WIDTH = Math.round(LOGO_TARGET_HEIGHT * LOGO_ASPECT_RATIO);

// Builds today's date from *local* date parts — deliberately does NOT go
// through `toISOString()`/UTC, which would shift the day near midnight in
// timezones ahead of UTC (same rule AsistenciaTab documents for attendance
// dates: local `getFullYear()/getMonth()/getDate()`, never a UTC string
// conversion).
function todayLongDateEs(): string {
  const now = new Date();
  const day = now.getDate();
  const month = MONTHS_ES[now.getMonth()];
  const year = now.getFullYear();
  return `${day} de ${month} de ${year}`;
}

// `constancias-${section.name}.pdf`, sanitized: strips diacritics, replaces
// anything that isn't alphanumeric/dash/underscore with a dash, collapses
// repeats.
function sanitizeFilename(name: string): string {
  const noDiacritics = name.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return noDiacritics
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Fetches the brand logo and returns it as a data URL for embedding in the
// PDF. pdfmake can only decode PNG/JPEG (not webp), so this MUST point at
// `public/brand/nombreLogo.png` (converted from nombreLogo.webp). Fails
// soft — returns `undefined` on any error so the PDF still generates
// without a logo instead of throwing.
async function fetchLogoDataUrl(): Promise<string | undefined> {
  try {
    const response = await fetch("/brand/nombreLogo.png");
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return await new Promise<string | undefined>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

function buildHeader(config: InstitutionConfig, logoDataUrl: string | undefined, pageBreakBefore: boolean): Content {
  const headerLines = config.headerLines.length > 0 ? config.headerLines : [config.academyName];
  const textStack: Content = {
    stack: headerLines.map((line, index) => ({
      text: line,
      alignment: "center",
      bold: index === 0,
      fontSize: index === 0 ? 12 : 9,
      color: index === 0 ? "#151515" : "#555555",
    })),
  };
  const pageBreak = pageBreakBefore ? ({ pageBreak: "before" } as const) : {};

  const stack: Content[] = [];
  if (logoDataUrl) {
    // Logo on its OWN line, pinned to the top-left corner, above the
    // (centered) institution header lines — the letterhead layout of the
    // reference document.
    stack.push({ image: logoDataUrl, width: LOGO_WIDTH, alignment: "left", margin: [0, 0, 0, 12] });
  }
  stack.push(textStack);

  return { margin: [0, 0, 0, 10], stack, ...pageBreak };
}

// Single word — "cursó" / "aprobó" / "desaprobó" — plugged into the body
// paragraph as "{verbo} el curso de {courseName}".
function getVerb(average: number | null, minApproving: number): string {
  if (average == null) return "cursó";
  return average >= minApproving ? "aprobó" : "desaprobó";
}

function buildStudentPage(
  report: SectionReport,
  student: ReportStudent,
  config: InstitutionConfig,
  logoDataUrl: string | undefined,
  isFirst: boolean
): Content[] {
  const { section, activities } = report;

  const tableBody: TableCell[][] = [
    [
      { text: "Actividad", bold: true, color: "#FFFFFF", fillColor: "#a16361", alignment: "left" },
      { text: "Peso (%)", bold: true, color: "#FFFFFF", fillColor: "#a16361", alignment: "center" },
      { text: "Calificación", bold: true, color: "#FFFFFF", fillColor: "#a16361", alignment: "center" },
    ],
    ...activities.map((activity): TableCell[] => {
      const gradeEntry = student.grades.find((g) => g.activityId === activity.id);
      const gradeValue = gradeEntry?.grade;
      return [
        { text: activity.name, alignment: "left" },
        { text: `${activity.percentage}%`, alignment: "center" },
        { text: gradeValue != null ? String(gradeValue) : "—", alignment: "center" },
      ];
    }),
    [
      { text: "Promedio final", bold: true, colSpan: 2, alignment: "left", fillColor: "#FDEAF2" },
      {},
      {
        text: student.average != null ? String(student.average) : "Sin calificaciones",
        bold: true,
        alignment: "center",
        fillColor: "#FDEAF2",
      },
    ],
  ];

  const condicionText =
    student.average == null
      ? "Sin calificaciones registradas"
      : student.average >= config.minApproving
        ? config.approvedLabel
        : config.failedLabel;

  // Single signatory now (was two side-by-side columns) — flanking "*"
  // columns keep the 50%-wide signature block centered on the page.
  const signatureBlock: Content = {
    columns: [
      { width: "*", text: "" },
      {
        width: "50%",
        alignment: "center",
        stack: [
          { text: " ", margin: [0, 20, 0, 0] },
          { canvas: [{ type: "line", x1: 20, y1: 0, x2: 160, y2: 0, lineWidth: 1, lineColor: "#151515" }] },
          { text: config.signatoryName || " ", bold: true, alignment: "center", margin: [0, 4, 0, 0] },
          { text: config.signatoryTitle, alignment: "center", fontSize: 9, color: "#555555" },
        ],
      },
      { width: "*", text: "" },
    ],
  };

  const page: Content[] = [
    buildHeader(config, logoDataUrl, !isFirst),
    { text: "CONSTANCIA DE CALIFICACIONES", alignment: "center", bold: true, fontSize: 16, margin: [0, 0, 0, 20] },
    {
      alignment: "justify",
      margin: [0, 0, 0, 15],
      text: [
        `La dirección de ${config.academyName} hace constar que el(la) alumno(a) `,
        { text: student.fullName, bold: true },
        `, con documento de identidad N° ${student.dni}, ${getVerb(student.average, config.minApproving)} el curso de `,
        { text: section.courseName, bold: true },
        `, con la siguiente carga académica y calificaciones:`,
      ],
    },
    {
      table: { widths: ["*", "auto", "auto"], body: tableBody },
      layout: {
        hLineColor: () => "#D9D9D9",
        vLineColor: () => "#D9D9D9",
      },
      margin: [0, 0, 0, 12],
    },
    {
      text: [
        "Condición: ",
        { text: condicionText, bold: true },
      ],
      margin: [0, 0, 0, 12],
    },
    { text: config.gradeScaleText, fontSize: 9, color: "#555555", margin: [0, 0, 0, 20] },
    {
      text: `Constancia expedida en ${config.city}, el ${todayLongDateEs()}.`,
      margin: [0, 0, 0, 40],
    },
    signatureBlock,
  ];

  return page;
}

// Pure builder — no I/O, no dynamic imports — shared by both the real
// download (`generateConstanciaPdf`) and the admin configurator's live
// preview (`getConstanciaPreviewDataUrl`), so they can never drift apart.
export function buildConstanciaDocDefinition(
  report: SectionReport,
  config: InstitutionConfig,
  logoDataUrl: string | undefined
): TDocumentDefinitions {
  const activeStudents = report.students.filter((student) => student.active);

  const content: Content[] =
    activeStudents.length > 0
      ? activeStudents.flatMap((student, index) => buildStudentPage(report, student, config, logoDataUrl, index === 0))
      : [{ text: "No hay estudiantes activos para generar la constancia.", alignment: "center", margin: [0, 40, 0, 0] }];

  return {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 60],
    defaultStyle: { fontSize: 10, color: "#151515" },
    footer: {
      text: config.contactFooter,
      alignment: "center",
      fontSize: 8,
      color: "#555555",
      margin: [40, 10, 40, 0],
    },
    content,
  };
}

// Dynamic import keeps pdfmake (and its vfs font payload) entirely out of
// the server bundle — the main SSR/build risk for this feature. pdfmake
// 0.3.x's vfs_fonts.js module.exports is the raw `{ filename: base64 }`
// map directly (not the old `{ pdfMake: { vfs } }` nested shape), so it's
// registered via `addVirtualFileSystem`, not a `pdfMake.vfs = ...` assign.
async function loadPdfMake() {
  const [{ default: pdfMake }, { default: vfs }] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  pdfMake.addVirtualFileSystem(vfs);
  return pdfMake;
}

// Builds and triggers the download of one PDF containing one page per
// active student in the section. Client-side only ("use client" + dynamic
// import of pdfmake above) so nothing pdfmake-related is ever touched
// during SSR/build.
export async function generateConstanciaPdf(report: SectionReport, config: InstitutionConfig): Promise<void> {
  const activeStudents = report.students.filter((student) => student.active);
  if (activeStudents.length === 0) {
    throw new Error("No hay estudiantes para generar constancias");
  }

  const pdfMake = await loadPdfMake();
  const logoDataUrl = await fetchLogoDataUrl();
  const docDefinition = buildConstanciaDocDefinition(report, config, logoDataUrl);

  const filename = `constancias-${sanitizeFilename(report.section.name)}.pdf`;
  pdfMake.createPdf(docDefinition).download(filename);
}

// Admin configurator live preview: same doc-definition builder as the real
// download, resolved to a data URL for an <iframe src>. Called repeatedly
// (debounced) as the admin edits the form, so it must stay side-effect-free
// beyond the pdfMake/logo fetches it already needs.
export async function getConstanciaPreviewDataUrl(report: SectionReport, config: InstitutionConfig): Promise<string> {
  const pdfMake = await loadPdfMake();
  const logoDataUrl = await fetchLogoDataUrl();
  const docDefinition = buildConstanciaDocDefinition(report, config, logoDataUrl);
  return pdfMake.createPdf(docDefinition).getDataUrl();
}
