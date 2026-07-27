// Default/fallback values for `InstitutionConfig` (PLAN_FEATURES 4.4
// polish). Config is now backend-driven (`GET/PATCH /institution-config`,
// see `src/redux/service/institutionConfigService.ts`); this object is used
// only as a fallback — before the backend has answered, if the fetch
// fails, or to seed the admin configurator's live preview on first paint.
import { InstitutionConfig } from "@/types/institutionConfig";

export const defaultInstitutionConfig: InstitutionConfig = {
  id: 0,
  academyName: "Alejandra Academia de Belleza",
  headerLines: [
    "República Bolivariana de Venezuela",
    "Ministerio del Poder Popular para la Educación",
    "Alejandra Academia de Belleza",
  ],
  signatoryName: "",
  signatoryTitle: "Directora",
  city: "",
  contactFooter: "",
  gradeScaleText:
    "Los resultados se interpretan en la escala numérica del 0 al 20; la calificación mínima aprobatoria es 15.",
  minApproving: 15,
  approvedLabel: "APROBADO",
  failedLabel: "DESAPROBADO",
};
