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
import { createUserCurrencyAccountStack } from "./account-stack.service.js";

const SUPPORTED_CURRENCIES = ["USD", "ZIG", "ZAR", "EUR", "GBP"] as const;
const MIN_AMOUNT = 0.01;
const MAX_AMOUNT = 999_999_999.99;

export const depositInputSchema = z.object({
  amount: z.coerce.number().positive().min(MIN_AMOUNT).max(MAX_AMOUNT),
  currency: z.enum(SUPPORTED_CURRENCIES),
  referenceId: z.string().max(100).optional(), // Idempotency key - prevents duplicate processing
  paymentMethod: z.string().optional(),
  method: z.string().optional(),
  purpose: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const withdrawInputSchema = z.object({
  amount: z.coerce.number().positive().min(MIN_AMOUNT).max(MAX_AMOUNT),
  currency: z.enum(SUPPORTED_CURRENCIES),
  referenceId: z.string().max(100).optional(), // Idempotency key
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
    where: { userId, currencyCode: currency, isActive: true, status: "active" },
  });
  if (!wallet) {
    throw validationError(`Wallet not found for currency ${currency}`);
  }
  return wallet;
}

/**
 * Freeze a specific currency wallet. Blocks deposit/withdrawal.
 */
export async function freezeWallet(userId: string, currency: CurrencyCode) {
  const wallet = await prisma.wallet.findFirst({
    where: { userId, currencyCode: currency },
  });
  if (!wallet) throw validationError(`Wallet not found for currency ${currency}`);
  return prisma.$transaction(async (tx) => {
    return tx.wallet.update({
      where: { id: wallet.id },
      data: { status: "suspended", isActive: false },
    });
  });
}

/**
 * Unfreeze (reactivate) a wallet.
 */
export async function unfreezeWallet(userId: string, currency: CurrencyCode) {
  const wallet = await prisma.wallet.findFirst({
    where: { userId, currencyCode: currency },
  });
  if (!wallet) throw validationError(`Wallet not found for currency ${currency}`);
  return prisma.$transaction(async (tx) => {
    return tx.wallet.update({
      where: { id: wallet.id },
      data: { status: "active", isActive: true },
    });
  });
}

/**
 * Calculate available balance for withdrawal (wallet balance minus locked portion when loan active).
 */
export function calculateAvailableForWithdrawal(
  walletBalance: Decimal | number,
  activeLoanBalance: Decimal | number,
  lockRatio = 0.2
): number {
  const wb = Number(walletBalance);
  const loan = Number(activeLoanBalance);
  if (loan <= 0) return wb;
  const locked = wb * lockRatio;
  return Math.max(0, wb - locked);
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
 * Create wallet for user/currency. Fails if already exists.
 * Use for explicit wallet creation (e.g. on user registration).
 */
export async function createWallet(
  userId: string,
  currency: CurrencyCode,
  txClient?: PrismaTransactionClient
) {
  const db = txClient ?? prisma;
  const existing = await db.wallet.findFirst({
    where: { userId, currencyCode: currency },
  });
  if (existing) {
    throw validationError(`Wallet already exists for user in ${currency}`);
  }
  if (txClient) {
    await createUserCurrencyAccountStack(txClient, userId, currency);
    return txClient.wallet.findFirstOrThrow({
      where: { userId, currencyCode: currency },
    });
  }
  return prisma.$transaction(async (tx) => {
    await createUserCurrencyAccountStack(tx, userId, currency);
    return tx.wallet.findFirstOrThrow({
      where: { userId, currencyCode: currency },
    });
  });
}

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
    if (txClient) {
      await createUserCurrencyAccountStack(txClient, userId, currency);
      wallet = await txClient.wallet.findFirstOrThrow({
        where: { userId, currencyCode: currency },
      });
    } else {
      wallet = await prisma.$transaction(async (tx) => {
        await createUserCurrencyAccountStack(tx, userId, currency);
        return tx.wallet.findFirstOrThrow({
          where: { userId, currencyCode: currency },
        });
      });
    }
  }
  return wallet;
}
