/**
 * FinEra KYC identity formats — server-side (must match `src/lib/kycIdentityFormats.ts`).
 */

export const NATIONAL_ID_ERROR =
  "Invalid National ID format. Expected: 54 2005580 Z 54";

export const STUDENT_ID_ERROR = "Invalid Student ID format. Expected: N02427344M";

export const STAFF_EMPLOYER_ID_ERROR =
  "Invalid ID format. Use 7–20 characters: start with a letter, then letters or numbers only (A–Z, 0–9).";

export const STRUCTURED_ADDRESS_ERROR =
  "Address must follow format: street name, house number, city, town";

export function stripKycInvisible(input: string): string {
  const s = input.normalize("NFKC");
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g, "");
}

export function extractNationalIdContent(raw: string): string {
  const flat = stripKycInvisible(raw).replace(/\s+/g, "");
  const out: string[] = [];
  for (let i = 0; i < flat.length && out.length < 12; i++) {
    const ch = flat[i]!;
    const len = out.length;
    if (len < 2 || (len >= 2 && len < 9) || (len >= 10 && len < 12)) {
      if (/\d/.test(ch)) out.push(ch);
    } else if (len === 9) {
      if (/[A-Za-z]/.test(ch)) out.push(ch.toUpperCase());
    }
  }
  return out.join("");
}

export function formatNationalIdDisplay(content: string): string {
  const c = extractNationalIdContent(content);
  if (c.length === 0) return "";
  if (c.length <= 2) return c;
  if (c.length <= 9) return `${c.slice(0, 2)} ${c.slice(2)}`;
  if (c.length <= 10) return `${c.slice(0, 2)} ${c.slice(2, 9)} ${c.slice(9)}`;
  return `${c.slice(0, 2)} ${c.slice(2, 9)} ${c.slice(9, 10)} ${c.slice(10, 12)}`;
}

export function normalizeNationalIdForSubmit(displayOrContent: string): string {
  const c = extractNationalIdContent(displayOrContent);
  if (c.length !== 12) return "";
  return formatNationalIdDisplay(c);
}

export function isNationalIdValid(displayOrContent: string): boolean {
  const c = extractNationalIdContent(displayOrContent);
  if (c.length !== 12) return false;
  if (!/^\d{9}[A-Z]\d{2}$/.test(c)) return false;
  return formatNationalIdDisplay(c) === normalizeNationalIdForSubmit(displayOrContent);
}

export function extractStudentIdContent(raw: string): string {
  const flat = stripKycInvisible(raw).replace(/\s+/g, "").toUpperCase();
  const out: string[] = [];
  for (let i = 0; i < flat.length && out.length < 10; i++) {
    const ch = flat[i]!;
    const len = out.length;
    if (len === 0) {
      if (/[A-Z]/.test(ch)) out.push(ch);
    } else if (len >= 1 && len <= 8) {
      if (/\d/.test(ch)) out.push(ch);
    } else if (len === 9) {
      if (/[A-Z]/.test(ch)) {
        out.push(ch);
        break;
      }
    }
  }
  return out.join("");
}

export function isStudentIdValid(value: string): boolean {
  return /^[A-Z]\d{8}[A-Z]$/.test(extractStudentIdContent(value));
}

export function extractStaffEmployerIdContent(raw: string): string {
  const flat = stripKycInvisible(raw).replace(/\s+/g, "").toUpperCase();
  let out = "";
  for (let i = 0; i < flat.length && out.length < 20; i++) {
    const ch = flat[i]!;
    if (/[A-Z0-9]/.test(ch)) out += ch;
  }
  if (out.length > 0 && !/[A-Z]/.test(out[0]!)) {
    out = out.replace(/^[^A-Z]+/, "");
  }
  return out.slice(0, 20);
}

export function isStaffEmployerIdValid(value: string): boolean {
  const s = extractStaffEmployerIdContent(value);
  return /^[A-Z][A-Z0-9]{5,19}$/.test(s);
}

export function normalizeCommaAddressPart(s: string): string {
  return stripKycInvisible(s)
    .replace(/[\uFF0C\u060C]/g, ",")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateStructuredResidentialAddress(
  addressLine1: string,
  addressLine2?: string
): { ok: true; normalizedLine1: string; normalizedLine2?: string } | { ok: false; error: string } {
  const a = normalizeCommaAddressPart(addressLine1);
  const b = addressLine2 != null && addressLine2.length > 0 ? normalizeCommaAddressPart(addressLine2) : "";
  const merged = b ? `${a},${b}` : a;
  const collapsed = merged.replace(/,\s*,/g, ",").replace(/^,+|,+$/g, "");
  const parts = collapsed
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length < 4) {
    return { ok: false, error: STRUCTURED_ADDRESS_ERROR };
  }
  const normalized = parts.join(", ");
  const firstComma = normalized.indexOf(",");
  const secondComma = normalized.indexOf(",", firstComma + 1);
  const thirdComma = normalized.indexOf(",", secondComma + 1);
  if (firstComma === -1 || secondComma === -1 || thirdComma === -1) {
    return { ok: false, error: STRUCTURED_ADDRESS_ERROR };
  }
  const street = normalized.slice(0, firstComma).trim();
  const house = normalized.slice(firstComma + 1, secondComma).trim();
  const city = normalized.slice(secondComma + 1, thirdComma).trim();
  const town = normalized.slice(thirdComma + 1).trim();
  if (!street || !house || !city || !town) {
    return { ok: false, error: STRUCTURED_ADDRESS_ERROR };
  }
  return {
    ok: true,
    normalizedLine1: `${street}, ${house}, ${city}, ${town}`,
    normalizedLine2: undefined,
  };
}
