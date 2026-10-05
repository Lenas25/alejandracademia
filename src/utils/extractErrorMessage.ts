import axios from "axios";

// Central API error -> Spanish user message mapper.
//
// NestJS produces two shapes (see git history for the original rationale):
//   - ValidationPipe 400s: `message: string[]` (English class-validator text)
//     and `error: "Bad Request"` (never shown to users).
//   - Controller catch blocks: `{ message: "<label>", error: "<reason>" }`.
//
// Examples (self-check, no test runner in this repo):
//   400 ["activities.0.percentage must be greater than 0"]
//     -> "Actividad 1: el porcentaje debe ser mayor que 0."
//   400 ["name must be longer than or equal to 3 characters"]
//     -> "El nombre debe tener al menos 3 caracteres."
//   400 ["property foo should not exist"] -> "Revisa los datos ingresados."
//   409 {message: "Ya existe un registro"} -> "Ya existe un registro"
//   network error / timeout -> "No se pudo conectar con el servidor. Revisa tu conexión."

type Label = { label: string; art: "El" | "La" };

const FIELD_LABELS: Record<string, Label> = {
  name: { label: "nombre", art: "El" },
  lastName: { label: "apellido", art: "El" },
  username: { label: "usuario", art: "El" },
  email: { label: "correo", art: "El" },
  phone: { label: "celular", art: "El" },
  id: { label: "DNI", art: "El" },
  password: { label: "contraseña", art: "La" },
  percentage: { label: "porcentaje", art: "El" },
  initialDate: { label: "fecha de inicio", art: "La" },
  endDate: { label: "fecha de fin", art: "La" },
  installmentsCount: { label: "número de cuotas", art: "El" },
  duration: { label: "duración", art: "La" },
  amount: { label: "monto", art: "El" },
  paidDate: { label: "fecha de pago", art: "La" },
  dueDate: { label: "fecha de vencimiento", art: "La" },
  grade: { label: "nota", art: "La" },
  date: { label: "fecha", art: "La" },
  role: { label: "rol", art: "El" },
  description: { label: "descripción", art: "La" },
  id_course: { label: "curso", art: "El" },
  id_tutor: { label: "tutor", art: "El" },
  sectionId: { label: "sección", art: "La" },
  activities: { label: "lista de actividades", art: "La" },
  status: { label: "estado", art: "El" },
};

const ITEM_LABELS: Record<string, string> = {
  activities: "Actividad",
  records: "Registro",
  installments: "Cuota",
  grades: "Nota",
};

// Each rule yields the predicate that follows the field label ("debe ...").
const RULES: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/must be greater than 0|must be a positive number/i, () => "debe ser mayor que 0"],
  [/must not be greater than (\d+)|must not exceed (\d+)/i, (m) => `no debe ser mayor que ${m[1] ?? m[2]}`],
  [/must not be less than (\d+)/i, (m) => `no debe ser menor que ${m[1]}`],
  [/must be a valid decimal number.*?max(?:imum)? (\d+) decimal/i, (m) => `debe ser un número válido con máximo ${m[1]} decimales`],
  [/must be a valid decimal number/i, () => "debe ser un número decimal válido"],
  [/should not be empty|must not be empty/i, () => "es obligatorio"],
  [/must be longer than or equal to (\d+) characters/i, (m) => `debe tener al menos ${m[1]} caracteres`],
  [/must be shorter than or equal to (\d+)/i, (m) => `debe tener como máximo ${m[1]} caracteres`],
  [/must be an email/i, () => "debe ser un correo válido"],
  [/must be an integer number/i, () => "debe ser un número entero"],
  [/must contain at least (\d+) elements?/i, (m) => `debe incluir al menos ${m[1]} ${m[1] === "1" ? "elemento" : "elementos"}`],
  [/must be an array/i, () => "debe ser una lista"],
  [/must be a boolean/i, () => "debe ser verdadero o falso"],
  [/must be one of the following values|must be a valid enum value/i, () => "tiene un valor no permitido"],
  [/must be a number/i, () => "debe ser un número"],
  [/must be a string/i, () => "debe ser un texto"],
  [/must be a valid iso 8601 date|YYYY-MM-DD/i, () => "debe ser una fecha válida (AAAA-MM-DD)"],
];

const ENGLISH_RE = /\b(the|must|should|cannot|failed|invalid|duplicate|violates|constraint|select|insert|column|relation|undefined|unauthorized|forbidden|bad request|not found|internal server|exception|query|syntax)\b/i;

const GENERIC = "Revisa los datos ingresados.";

function labelFor(segment: string): Label {
  return FIELD_LABELS[segment] ?? { label: segment, art: "El" };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function translateValidation(raw: string): string | null {
  if (/^property \S+ should not exist$/i.test(raw)) return null;
  const m = raw.match(/^(\S+)\s+(.*)$/);
  if (!m) return null;
  const segments = m[1].replace(/\[(\d+)\]/g, ".$1").split(".");
  let predicate: string | null = null;
  for (const [re, fn] of RULES) {
    const r = m[2].match(re);
    if (r) { predicate = fn(r); break; }
  }
  if (!predicate) return null;
  const last = [...segments].reverse().find((s) => !/^\d+$/.test(s)) ?? segments[0];
  const idxPos = segments.findIndex((s) => /^\d+$/.test(s));
  const field = labelFor(last);
  if (idxPos > 0) {
    const item = ITEM_LABELS[segments[idxPos - 1]] ?? capitalize(labelFor(segments[idxPos - 1]).label);
    return `${item} ${Number(segments[idxPos]) + 1}: ${field.art.toLowerCase()} ${field.label} ${predicate}`;
  }
  return `${field.art} ${field.label} ${predicate}`;
}

function mapValidation(list: string[]): string {
  const out: string[] = [];
  for (const raw of list) {
    const t = typeof raw === "string" ? translateValidation(raw) : null;
    if (t && !out.includes(t)) out.push(t);
  }
  if (out.length === 0) return GENERIC;
  const shown = out.slice(0, 3).map((s) => `${s}.`);
  if (out.length > 3) shown.push(`y ${out.length - 3} más.`);
  return shown.join("\n");
}

export function looksCustomSpanish(s: string): boolean {
  const t = s.trim();
  return t.length > 0 && t.length <= 200 && !ENGLISH_RE.test(t) && !/\bat \S+:\d+|ER_|SQLSTATE/.test(t);
}

function byStatus(status: number): string {
  if (status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";
  if (status === 403) return "No tienes permiso para realizar esta acción.";
  if (status === 404) return "No se encontró el recurso solicitado.";
  if (status === 409) return "Ya existe un registro con esos datos.";
  if (status === 413) return "El archivo es demasiado grande.";
  if (status === 422) return GENERIC;
  if (status === 429) return "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.";
  if (status >= 500) return "Ocurrió un error en el servidor. Inténtalo de nuevo.";
  return GENERIC;
}

export function mapApiError(error: unknown, opts?: { unauthorized?: string }): string {
  if (!axios.isAxiosError(error)) return "Ocurrió un error inesperado. Inténtalo de nuevo.";
  if (!error.response) return "No se pudo conectar con el servidor. Revisa tu conexión.";
  const { status } = error.response;
  const data = error.response.data as { message?: unknown; error?: unknown } | undefined;
  if (status === 401 && opts?.unauthorized) return opts.unauthorized;
  if (status === 400 || status === 422) {
    if (Array.isArray(data?.message)) return mapValidation(data.message as string[]);
  }
  // Business errors: backend label (`message`) plus optional specific reason (`error`).
  if (status < 500 && status !== 401 && status !== 403) {
    const parts: string[] = [];
    for (const v of [data?.message, data?.error]) {
      if (typeof v === "string" && looksCustomSpanish(v) && !parts.includes(v)) parts.push(v);
    }
    if (parts.length > 0) return parts.join(" — ");
  }
  if (status >= 500 && typeof data?.message === "string" && looksCustomSpanish(data.message)) {
    return data.message;
  }
  return byStatus(status);
}

// Backwards-compatible export: same signature, now returns the Spanish mapped message.
export function extractErrorMessage(error: unknown): string {
  return mapApiError(error);
}
