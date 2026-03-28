/**
 * Map Zod errors to { field, error }[] for API responses.
 */

import type { ZodError } from "zod";

export interface FieldErrorItem {
  field: string;
  error: string;
}

export function zodErrorToFieldErrors(err: ZodError): FieldErrorItem[] {
  const out: FieldErrorItem[] = [];
  for (const issue of err.issues) {
    const path = issue.path.filter((p): p is string | number => p !== undefined);
    const field =
      path.length === 0 ? "_root" : path.map((p) => String(p)).join(".");
    const message = issue.message || "Invalid value";
    out.push({ field, error: message });
  }
  return out;
}
