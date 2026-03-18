/**
 * FinEra INCLUSIVE CREDIT - Form Validation Utilities
 * Production-ready validation for KYC, security, and data integrity.
 */

export const VALIDATION = {
  MIN_AGE: 16,
  MAX_AGE: 120,
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  PHONE_E164_REGEX: /^\+[1-9]\d{1,14}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

/** Validate age from ISO date string (YYYY-MM-DD) */
export function validateAge(dob: string, minAge = VALIDATION.MIN_AGE): boolean {
  if (!dob) return false;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= minAge;
}

/** Validate password strength (placeholder for backend rules) */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
    return { valid: false, message: `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters` };
  }
  return { valid: true };
}

/** Validate email format */
export function validateEmail(email: string): boolean {
  return VALIDATION.EMAIL_REGEX.test(email);
}

/** Validate phone in E.164 format */
export function validatePhoneE164(phone: string): boolean {
  return VALIDATION.PHONE_E164_REGEX.test(phone);
}
