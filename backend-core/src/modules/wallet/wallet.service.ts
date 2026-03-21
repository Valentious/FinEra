/**
 * FinEra Backend - Wallet Service
 * All balance calculations, input validation, and DB writes.
 * No transaction logic here - use transaction.service.ts for atomic updates.
 */

import { prisma } from "../../infrastructure/database/index.js";
import type { CurrencyCode } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { validationError } from "../../middlewares/errorHandler.js";
import { z } from "zod";

const SUPPORTED_CURRENCIES = ["USD", "ZIG", "ZAR", "EUR", "GBP"] as const;
const MIN_AMOUNT = 0.01;
const MAX_AMOUNT = 999_999_999.99;

export const depositInputSchema = z.object({
  amount: z.coerce.number().positive().min(MIN_AMOUNT).max(MAX_AMOUNT),
  currency: z.enum(SUPPORTED_CURRENCIES).optional().default("USD"),
  paymentMethod: z.string().optional(),
  method: z.string().optional(),
  purpose: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const withdrawInputSchema = z.object({
  amount: z.coerce.number().positive().min(MIN_AMOUNT).max(MAX_AMOUNT),
  currency: z.enum(SUPPORTED_CURRENCIES).optional().default("USD"),
  withdrawalMethod: z.string().optional(),
  method: z.string().optional(),
  destination: z.string().optional(),
  accountDetails: z.record(z.unknown()).optional(),
});

export type DepositInput = z.infer<typeof depositInputSchema>;
export type WithdrawInput = z.infer<typeof withdrawInputSchema>;

export function validateDepositInput(data: unknown): DepositInput {
  const parsed = depositInputSchema.safeParse(data);
  if (!parsed.success) {
    throw validationError("Invalid deposit request", { zod: parsed.error.flatten() });
  }
  return parsed.data;
}

export function validateWithdrawInput(data: unknown): WithdrawInput {
  const parsed = withdrawInputSchema.safeParse(data);
  if (!parsed.success) {
    throw validationError("Invalid withdrawal request", { zod: parsed.error.flatten() });
  }
  return parsed.data;
}

/**
 * Get wallet for user and currency. Throws if not found.
 */
export async function getWalletOrThrow(userId: string, currency: CurrencyCode) {
  const wallet = await prisma.wallet.findFirst({
    where: { userId, currencyCode: currency, isActive: true },
  });
  if (!wallet) {
    throw validationError(`Wallet not found for currency ${currency}`);
  }
  return wallet;
}

/**
 * Calculate available balance for withdrawal (savings minus locked portion when loan active).
 */
export function calculateAvailableForWithdrawal(
  savingsBalance: Decimal,
  activeLoanBalance: Decimal,
  lockRatio = 0.2
): number {
  const savings = Number(savingsBalance);
  const loan = Number(activeLoanBalance);
  if (loan <= 0) return savings;
  const locked = savings * lockRatio;
  return Math.max(0, savings - locked);
}

/**
 * Validate sufficient balance for withdrawal.
 */
export function validateSufficientBalance(
  available: number,
  requested: number
): void {
  if (requested > available) {
    throw validationError(
      `Insufficient balance. Available: ${available.toFixed(2)}, requested: ${requested.toFixed(2)}`
    );
  }
}

/**
 * Generate unique transaction reference.
 */
export function generateReference(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `TXN-${dateStr}-${rand}`;
}

type PrismaTransactionClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/**
 * Ensure wallet exists for user/currency. Creates if missing.
 * Pass txClient when called from within a $transaction.
 */
export async function ensureWallet(
  userId: string,
  currency: CurrencyCode,
  txClient?: PrismaTransactionClient
) {
  const db = txClient ?? prisma;
  let wallet = await db.wallet.findFirst({
    where: { userId, currencyCode: currency },
  });
  if (!wallet) {
    const accountNumber = `FIN${Date.now().toString().slice(-9)}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
    wallet = await db.wallet.create({
      data: {
        userId,
        currencyCode: currency,
        accountNumber,
        balance: 0,
        availableBalance: 0,
        savingsBalance: 0,
      },
    });
  }
  return wallet;
}
