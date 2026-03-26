/**
 * FinEra INCLUSIVE FINANCIAL ECOSYSTEM - Form Validation Utilities
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

/** Validate institutional email (Staff & Alumni): academic, research, government, org domains */
export function validateInstitutionalEmail(email: string): boolean {
  if (!VALIDATION.EMAIL_REGEX.test(email)) return false;
  return INSTITUTIONAL_DOMAIN_REGEX.test(email) || /\.(edu|ac\.|gov)\.?/i.test(email);
}

/** Validate student email: university/college educational institution domains */
export function validateStudentEmail(email: string): boolean {
  if (!VALIDATION.EMAIL_REGEX.test(email)) return false;
  return /\.(edu|ac\.[a-z]{2,}|ac\.uk|ac\.za|ac\.zw)/i.test(email) || /@[a-z0-9-]+\.(edu|ac\.)/i.test(email);
}

/** Validate phone in E.164 format */
export function validatePhoneE164(phone: string): boolean {
  return VALIDATION.PHONE_E164_REGEX.test(phone);
}

/** Address Line 1: required, min 5 chars. Address Line 2: optional. */
export const ADDRESS = {
  MIN_LINE1_LENGTH: 5,
  validateAddressLine1: (v: string): string | null =>
    v && v.trim().length >= ADDRESS.MIN_LINE1_LENGTH ? null : "Address Line 1 is required (min 5 characters)",
} as const;
