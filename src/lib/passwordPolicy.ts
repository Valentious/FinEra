/**
 * Production password policy: letters (upper + lower), digits, symbols.
 * Keep in sync with backend-core auth.validation.ts where applicable.
 */

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export const PASSWORD_POLICY_HINT =
  "Use 8–128 characters with uppercase, lowercase, a number, and a symbol (!@#$%^&* etc.).";

export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < PASSWORD_MIN) {
    return { valid: false, message: `Password must be at least ${PASSWORD_MIN} characters.` };
  }
  if (password.length > PASSWORD_MAX) {
    return { valid: false, message: `Password must not exceed ${PASSWORD_MAX} characters.` };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Include at least one lowercase letter." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Include at least one uppercase letter." };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: "Include at least one digit." };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: "Include at least one symbol (e.g. !@#$%^&*)." };
  }
  return { valid: true };
}
