/**
 * Date of birth — KYC / GDPR-sensitive. Store and transmit as ISO 8601 calendar date only (YYYY-MM-DD).
 * Age checks use local calendar semantics (no UTC midnight shifts) via noon anchor.
 */

export const DOB = {
  /** Minimum age for profile & fintech onboarding (configurable) */
  MIN_AGE_YEARS: 18,
  /** Oldest plausible DOB window */
  MAX_AGE_YEARS: 100,
} as const;

export type DobValidationError = "required" | "invalid" | "future" | "too_old" | "underage";

/** Parse YYYY-MM-DD at local noon to avoid timezone date-shift. */
export function parseIsoDateToLocalNoon(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso.trim())) return null;
  const d = new Date(`${iso.trim()}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Age in full years (birthday not yet reached this year => subtract one). */
export function getAgeFromIsoDate(iso: string): number | null {
  const birth = parseIsoDateToLocalNoon(iso);
  if (!birth) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function validateDobIso(
  iso: string | undefined | null,
  minAge = DOB.MIN_AGE_YEARS,
  maxAge = DOB.MAX_AGE_YEARS
): { ok: true; iso: string } | { ok: false; error: DobValidationError } {
  if (iso == null || String(iso).trim() === "") return { ok: false, error: "required" };
  const trimmed = String(iso).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return { ok: false, error: "invalid" };
  const d = parseIsoDateToLocalNoon(trimmed);
  if (!d) return { ok: false, error: "invalid" };
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (d > today) return { ok: false, error: "future" };
  const minBirth = new Date();
  minBirth.setFullYear(minBirth.getFullYear() - (maxAge + 1));
  if (d < minBirth) return { ok: false, error: "too_old" };
  const age = getAgeFromIsoDate(trimmed);
  if (age === null) return { ok: false, error: "invalid" };
  if (age < minAge) return { ok: false, error: "underage" };
  return { ok: true, iso: trimmed };
}

/** ISO min date string (DOB) for native `input[type=date]`: oldest allowed birthdate. */
export function getMinDobIsoString(maxAgeYears = DOB.MAX_AGE_YEARS): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - maxAgeYears);
  return formatIsoDate(d);
}

/** ISO max date string: youngest allowed (min age). */
export function getMaxDobIsoString(minAgeYears = DOB.MIN_AGE_YEARS): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - minAgeYears);
  return formatIsoDate(d);
}

function formatIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dobErrorMessage(code: DobValidationError): string {
  switch (code) {
    case "required":
      return "Date of birth is required";
    case "invalid":
      return "Invalid date";
    case "future":
      return "Invalid date";
    case "too_old":
      return "Invalid date";
    case "underage":
      return "You must be at least 18 years old";
    default:
      return "Invalid date";
  }
}
