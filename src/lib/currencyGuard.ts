/**
 * FRONTEND HARD LOCK - Currency Context REQUIRED
 *
 * All API calls MUST include currency. This guard enforces it.
 * If currency is missing, we throw - no inference, no default.
 */

const REQUIRED_MSG =
  "Currency context REQUIRED. Set active account in Select Account before this operation.";

export function requireCurrency(currency: string | undefined | null): string {
  if (!currency || typeof currency !== "string" || currency.trim() === "") {
    throw new Error(REQUIRED_MSG);
  }
  return currency;
}
