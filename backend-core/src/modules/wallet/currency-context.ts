/**
 * CURRENCY ISOLATION BOUNDARY (CIB)
 *
 * Every operation MUST carry currency context. No optional, no inferred.
 * This is the mandatory gatekeeper for all wallet operations.
 */

import type { CurrencyCode } from "@prisma/client";
import type { Wallet } from "@prisma/client";
import { prisma } from "../../infrastructure/database/index.js";
import { validationError } from "../../middlewares/errorHandler.js";

/** MANDATORY: Currency context for every operation */
export interface CurrencyContext {
  user_id: string;
  currency_code: CurrencyCode;
  wallet_id: string;
}

/**
 * FORCE WALLET RESOLUTION - GATEKEEPER
 * ALL operations MUST go through this. No shortcuts allowed.
 *
 * Resolves wallet by (user_id, currency_code).
 * Throws if wallet not found - no fallback, no default.
 */
export async function resolveWallet(
  userId: string,
  currencyCode: CurrencyCode
): Promise<Wallet> {
  const wallet = await prisma.wallet.findFirst({
    where: {
      userId,
      currencyCode,
      isActive: true,
      status: "active",
    },
  });

  if (!wallet) {
    throw validationError(
      `Wallet not found for currency ${currencyCode}. User must have an active wallet for this currency.`
    );
  }

  return wallet;
}

/**
 * Resolve wallet within a transaction. Use for atomic operations.
 */
export async function resolveWalletInTx(
  tx: { wallet: { findFirst: typeof prisma.wallet.findFirst } },
  userId: string,
  currencyCode: CurrencyCode
): Promise<Wallet> {
  const wallet = await tx.wallet.findFirst({
    where: {
      userId,
      currencyCode,
      isActive: true,
      status: "active",
    },
  });

  if (!wallet) {
    throw validationError(
      `Wallet not found for currency ${currencyCode}. User must have an active wallet for this currency.`
    );
  }

  return wallet;
}

/** Validate that request currency matches context - reject mismatches */
export function validateCurrencyContext(
  requestCurrency: CurrencyCode | string | undefined,
  expectedCurrency: CurrencyCode,
  operation: string
): void {
  if (!requestCurrency) {
    throw validationError(
      `Currency context REQUIRED. ${operation} must include currency_code.`
    );
  }
  const req = String(requestCurrency).toUpperCase();
  const exp = String(expectedCurrency).toUpperCase();
  if (req !== exp) {
    throw validationError(
      `Currency mismatch: request has ${req}, expected ${exp}. ${operation} rejected.`
    );
  }
}
