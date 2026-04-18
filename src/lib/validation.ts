/**
 * FinEra INCLUSIVE CREDIT - Form Validation Utilities
 * Production-ready validation for KYC, security, and data integrity.
 */

import { validatePasswordStrength } from "./passwordPolicy";

export const VALIDATION = {
  /** KYC / FinEra policy: minimum age for registration and profile */
  MIN_AGE: 18,
  MAX_AGE: 120,
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  PHONE_E164_REGEX: /^\+[1-9]\d{1,14}$/,
  /** Total national digits (excluding +); aligned with backend `normalizePhone`. */
  PHONE_NATIONAL_DIGITS_MIN: 10,
  PHONE_NATIONAL_DIGITS_MAX: 15,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

/** Validate age from ISO date string (YYYY-MM-DD). Uses noon anchor to avoid timezone date-shift. */
export function validateAge(dob: string, minAge = VALIDATION.MIN_AGE): boolean {
  if (!dob) return false;
  const birth = new Date(`${dob.trim()}T12:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= minAge;
}

/** Validate password strength (aligned with backend + passwordPolicy) */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  return validatePasswordStrength(password);
}

/** Validate email format */
export function validateEmail(email: string): boolean {
  return VALIDATION.EMAIL_REGEX.test(email);
}

/** Institutional domain patterns: .edu, .ac.*, .gov, org domains */
const INSTITUTIONAL_DOMAIN_REGEX = /@([a-z0-9-]+\.(edu|ac\.[a-z]{2,}|gov\.[a-z]{2,}|gov)|[a-z0-9-]+\.(edu|ac\.[a-z]{2,}|gov\.[a-z]{2,}|gov)(\.[a-z]{2})?)$/i;

/** Validate institutional email (Staff & Employer): academic, research, government, org domains */
export function validateInstitutionalEmail(email: string): boolean {
  if (!VALIDATION.EMAIL_REGEX.test(email)) return false;
  return INSTITUTIONAL_DOMAIN_REGEX.test(email) || /\.(edu|ac\.|gov)\.?/i.test(email);
}

/** Validate student email: university educational institution domains */
export function validateStudentEmail(email: string): boolean {
  if (!VALIDATION.EMAIL_REGEX.test(email)) return false;
  return /\.(edu|ac\.[a-z]{2,}|ac\.uk|ac\.za|ac\.zw)/i.test(email) || /@[a-z0-9-]+\.(edu|ac\.)/i.test(email);
}

/** User-facing copy when the number is too short or missing digits after the country code. */
export const PHONE_NUMBER_INCOMPLETE_MESSAGE =
  "Phone number is incomplete. Enter the full number with country code (10–15 digits), e.g. +263 77 123 4567.";

/**
 * True when the value has enough digits for a full international number (same length rule as API `normalizePhone`).
 */
export function isCompletePhoneNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return (
    digits.length >= VALIDATION.PHONE_NATIONAL_DIGITS_MIN &&
    digits.length <= VALIDATION.PHONE_NATIONAL_DIGITS_MAX
  );
}

/** Validate phone in E.164 format */
export function validatePhoneE164(phone: string): boolean {
  return VALIDATION.PHONE_E164_REGEX.test(phone);
}

/** Address Line 1: required, comma-separated residential format. Address Line 2: optional. */
export const ADDRESS = {
  MIN_LINE1_LENGTH: 8,
  /** UI copy: four comma-separated parts */
  RESIDENTIAL_LINE1_HINT:
    "Format: street name, house number, city, town — four parts separated by commas.",
  validateAddressLine1: (v: string): string | null => {
    const t = v?.trim() ?? "";
    if (!t) return "Address Line 1 is required";
    const parts = t
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    if (parts.length < 4) {
      return "Use four comma-separated parts: street name, house number, city, town.";
    }
    if (t.length < ADDRESS.MIN_LINE1_LENGTH) {
      return "Address looks too short; include street, number, city, and town.";
    }
    return null;
  },
} as const;

/**
 * Zimbabwe National ID UI mask: `## ####### L ##` (e.g. 54 1234567 Z 54).
 * Non-alphanumeric stripped; segments built in order from the remaining characters.
 */
export function normalizeNationalIdZwInput(input: string): string {
  const s = input.replace(/\s/g, "").toUpperCase();
  let i = 0;
  const take = (n: number, pred: (c: string) => boolean) => {
    let out = "";
    while (i < s.length && out.length < n && pred(s[i])) out += s[i++];
    return out;
  };
  const d1 = take(2, (c) => /[0-9]/.test(c));
  if (d1.length < 2) return d1;
  const d2 = take(7, (c) => /[0-9]/.test(c));
  if (d2.length < 7) return `${d1} ${d2}`;
  const L = take(1, (c) => /[A-Z]/.test(c));
  if (L.length === 0) return `${d1} ${d2}`;
  const d3 = take(2, (c) => /[0-9]/.test(c));
  if (d3.length === 0) return `${d1} ${d2} ${L}`;
  return `${d1} ${d2} ${L} ${d3}`;
}

export function isCompleteNationalIdZw(value: string): boolean {
  return /^\d{2} \d{7} [A-Z] \d{2}$/.test(value.trim());
}

export function validateNationalIdZw(value: string): string | null {
  const v = value.trim();
  if (!v) return "National ID is required";
  if (!isCompleteNationalIdZw(v)) {
    return "National ID must match 54 1234567 Z 54 (2 digits, 7 digits, 1 letter, 2 digits, spaces optional when typing).";
  }
  return null;
}

/** Student ID mask: N + 8 alphanumeric + M (10 chars), e.g. N12345678M */
export function normalizeStudentIdMask(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 10);
}

export function isValidStudentIdFormat(value: string): boolean {
  return /^N[A-Z0-9]{8}M$/.test(value.trim());
}

export function validateStudentIdZw(value: string): string | null {
  const v = normalizeStudentIdMask(value);
  if (!v) return "Student ID is required";
  if (!isValidStudentIdFormat(v)) {
    return "Student ID must be exactly 10 characters: N + 8 letters or digits + M (e.g. N12345678M).";
  }
  return null;
}

export function normalizeStaffEmployerIdInput(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 24);
}

export function validateStaffOrEmployerId(value: string): string | null {
  const v = normalizeStaffEmployerIdInput(value);
  if (!v) return "ID is required";
  if (v.length < 4 || v.length > 24) {
    return "ID must be 4–24 characters (letters, numbers, or hyphen).";
  }
  return null;
}

export function validateNationalOrStudentId(value: string): string | null {
  const n = normalizeNationalIdZwInput(value).trim();
  if (isCompleteNationalIdZw(n)) return null;
  const s = normalizeStudentIdMask(value);
  if (isValidStudentIdFormat(s)) return null;
  return "Enter a valid National ID (e.g. 54 1234567 Z 54) or Student ID (e.g. N12345678M).";
}

export const PROFILE_FORMAT_EXAMPLES = {
  nationalIdZw: "54 1234567 Z 54",
  studentId: "N12345678M",
  addressLine1: "Samora Machel Avenue, 15, Harare, Harare",
} as const;

