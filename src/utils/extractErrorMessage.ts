import axios from "axios";

// Extracts a human-readable reason from a backend error response. NestJS
// produces two different shapes depending on where the rejection happens:
//   - ValidationPipe rejections (400, before the controller runs): the real
//     field-level reason lives in `message` (string[]) while `error` is just
//     the generic HTTP reason phrase ("Bad Request", "Unauthorized").
//   - Controller-level catch blocks (e.g. SectionController, PaymentController
//     — every controller in this codebase follows the same manual
//     `@Res() response.json({ message, error })` pattern): `message` is a
//     generic label ("Error al registrar la cuota") while `error` holds the
//     actual thrown reason.
// Both fields can carry useful, non-overlapping information, so combine
// whatever is present instead of picking one and discarding the other.
//
// Extracted from `sectionService.ts` into this shared util (sdd/pagos/design
// — "root-source fix per secciones lesson") so every thunk across the app
// surfaces real backend error reasons instead of duplicating this logic or
// silently dropping it (the exact bug class documented in the "silent-save"
// incident referenced in the design ADR).
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data as { message?: string | string[]; error?: string } | undefined;
    const reasons: string[] = [];
    if (Array.isArray(data?.message)) reasons.push(...data.message);
    else if (typeof data?.message === 'string') reasons.push(data.message);
    if (typeof data?.error === 'string' && !reasons.includes(data.error)) reasons.push(data.error);
    return reasons.length > 0 ? reasons.join(' — ') : 'Ocurrió un error inesperado';
  }
  return 'No se pudo conectar con el servidor';
}
