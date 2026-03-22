/**
 * FinEra - Strict Validation Layer
 *
 * - Reject if wallet.currency_code != transaction.currency_code
 * - Reject cross-currency operations
 * - Enforce currency isolation
 */

import type { CurrencyCode } from "@prisma/client";
import { validationError } from "../../middlewares/errorHandler.js";

/**
 * CRITICAL: Ensure transaction currency matches wallet currency.
 * Must be called before any balance mutation.
 */
export function assertCurrencyMatch(
  walletCurrency: CurrencyCode,
  transactionCurrency: CurrencyCode,
  context = "operation"
): void {
  if (walletCurrency !== transactionCurrency) {
    throw validationError(
      `Currency mismatch: wallet is ${walletCurrency}, ${context} is ${transactionCurrency}. Cross-currency operations rejected.`
    );
  }
}

/**
 * Reject cross-currency transfer (e.g. USD wallet -> ZAR wallet).
 * Same-currency transfer only, unless FX module handles it separately.
 */
export function assertSameCurrencyForTransfer(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): void {
  if (fromCurrency !== toCurrency) {
    throw validationError(
      `Cross-currency transfer rejected: ${fromCurrency} -> ${toCurrency}. Use FX convert endpoint for currency conversion.`
    );
  }
}

/**
 * Ensure amount is positive for financial operations.
 */
export function assertPositiveAmount(amount: number, field = "amount"): void {
  if (amount <= 0 || !Number.isFinite(amount)) {
    throw validationError(`${field} must be a positive number`);
  }
}
