/**
 * Strips redundant leading zeros from a raw `<input type="number">` string
 * as the user types (e.g. "014" -> "14", "00" -> "0"), without touching
 * decimals ("0.5" stays "0.5") or an in-progress empty value.
 *
 * Native number inputs don't do this normalization themselves: typing over
 * a pre-filled "0" without first selecting it produces "01", "014", etc.
 * because the DOM just concatenates keystrokes into the field's string
 * value. Combine this with select-all-on-focus so the common case (typing
 * straight over the placeholder zero) never hits the bug in the first
 * place.
 */
export function normalizeLeadingZero(raw: string): string {
  if (raw === "") return raw;
  const normalized = raw.replace(/^0+(?=\d)/, "");
  return normalized === "" ? "0" : normalized;
}
