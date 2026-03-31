/**
 * FinEra - Production Transaction Engine
 *
 * STRICT CURRENCY ISOLATION (Binance/Deriv-style):
 * - Each operation affects ONLY one wallet + its ledger
 * - NEVER query/update other wallets
 * - NEVER aggregate balances across currencies
 *
 * Flow: Identify wallet ΓåÆ LOCK ΓåÆ Validate ΓåÆ Update + Ledger ΓåÆ RELEASE
 */

import { prisma } from "../../infrastructure/database/index.js";
import type { CurrencyCode } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { validationError } from "../../middlewares/errorHandler.js";
import { calculateAvailableForWithdrawal } from "./wallet.service.js";
import { assertCurrencyMatch, assertPositiveAmount } from "./validation.layer.js";
import {
  getOrCreateLedger as ledgerGetOrCreate,
  recordEntry as ledgerRecordEntry,
  updateLedgerBalance as ledgerUpdateBalance,
} from "./ledger.service.js";
import { validateCurrencyActive } from "./currency.config.js";
import { allocateWalletNumericId } from "../../infrastructure/ledger/wallet-numeric-id.js";
import { assertTransactionLedgerBalanced } from "../../infrastructure/ledger/double-entry.js";
import { sealTransactionLedgerChain } from "./ledger-hash.service.js";

type TxClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export function generateReference(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `TXN-${dateStr}-${rand}`;
}

/** Get ledger for currency (create if missing). Each currency = OWN ledger. */
async function getOrCreateLedger(tx: TxClient, currency: CurrencyCode) {
  return ledgerGetOrCreate(currency, tx);
}

/**
 * STEP 2: Lock wallet by (user_id + currency_code).
 * Row-level lock (FOR UPDATE) - prevents race conditions.
 * Returns savingsBalance and activeLoanBalance for available-for-withdrawal calculation.
 */
async function lockWallet(
  tx: TxClient,
  userId: string,
  currency: CurrencyCode
): Promise<{
  id: string;
  savingsBalance: number;
  activeLoanBalance: number;
  currencyCode: CurrencyCode;
}> {
  const [row] = await tx.$queryRaw<
    Array<{ id: string; savingsBalance: string; activeLoanBalance: string; currencyCode: string; status: string }>
  >`
    SELECT id, "savingsBalance"::text as "savingsBalance", "activeLoanBalance"::text as "activeLoanBalance", "currencyCode", status FROM "Wallet"
    WHERE "userId" = ${userId} AND "currencyCode" = ${currency} AND "isActive" = true AND status = 'active'
    FOR UPDATE
  `;
  if (!row) throw validationError(`Wallet not found for currency ${currency}`);
  if (row.status !== "active") {
    throw validationError(`Wallet is ${row.status}; operations not allowed`);
  }
  return {
    id: row.id,
    savingsBalance: parseFloat(row.savingsBalance || "0"),
    activeLoanBalance: parseFloat(row.activeLoanBalance || "0"),
    currencyCode: row.currencyCode as CurrencyCode,
  };
}

/**
 * Ensure wallet exists. Creates if missing. Use only during registration/deposit when wallet may not exist.
 */
async function ensureWallet(
  tx: TxClient,
  userId: string,
  currency: CurrencyCode
): Promise<{ id: string; currencyCode: CurrencyCode }> {
  let wallet = await tx.wallet.findFirst({
    where: { userId, currencyCode: currency },
    select: { id: true, currencyCode: true },
  });
  if (!wallet) {
    const accountNumber = `FIN${Date.now().toString().slice(-9)}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
    const walletNumericId = await allocateWalletNumericId(
      tx as Parameters<typeof allocateWalletNumericId>[0]
    );
    wallet = await tx.wallet.create({
      data: {
        userId,
        currencyCode: currency,
        accountNumber,
        walletNumericId,
        balance: 0,
        availableBalance: 0,
        savingsBalance: 0,
      },
      select: { id: true, currencyCode: true },
    });
  }
  return wallet;
}

async function postLedgerEntry(
  tx: TxClient,
  params: {
    ledgerId: string;
    transactionId: string;
    currency: CurrencyCode;
    entryType: "DEBIT" | "CREDIT";
    amount: number;
    balanceAfter: number;
    accountCode: string;
    description: string;
  }
): Promise<void> {
  await ledgerRecordEntry(tx, {
    ledgerId: params.ledgerId,
    transactionId: params.transactionId,
    currencyCode: params.currency,
    entryType: params.entryType,
    amount: params.amount,
    balanceAfter: params.balanceAfter,
    accountCode: params.accountCode,
    description: params.description,
  });
}

async function updateLedgerBalance(tx: TxClient, ledgerId: string, delta: number): Promise<void> {
  await ledgerUpdateBalance(tx, ledgerId, delta);
}

export interface DepositParams {
  userId: string;
  currency: CurrencyCode;
  amount: number;
  fee?: number;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface DepositResult {
  transactionId: string;
  reference: string;
  newBalance: number;
}

/**
 * Check idempotency - return existing transaction result if reference already processed.
 */
async function checkIdempotency(
  tx: TxClient,
  reference: string
): Promise<{ transactionId: string; reference: string; newBalance: number } | null> {
  const existing = await tx.transaction.findUnique({
    where: { reference },
    select: { id: true, reference: true, walletId: true },
  });
  if (!existing) return null;
  const wallet = await tx.wallet.findUnique({
    where: { id: existing.walletId },
    select: { savingsBalance: true },
  });
  return {
    transactionId: existing.id,
    reference: existing.reference,
    newBalance: Number(wallet?.savingsBalance ?? 0),
  };
}

/**
 * Deposit: ONLY affects the specified currency wallet + ledger.
 * STEP 1: Idempotency check | STEP 2: Identify wallet | STEP 3: LOCK | STEP 4: Validate | STEP 5: Update + Ledger | STEP 6: Commit
 */
export async function processDeposit(params: DepositParams): Promise<DepositResult> {
  await validateCurrencyActive(params.currency);
  assertPositiveAmount(params.amount, "amount");
  const fee = params.fee ?? 0;
  const netAmount = params.amount - fee;
  const reference = params.reference ?? generateReference();

  return prisma.$transaction(async (tx) => {
    const existing = await checkIdempotency(tx, reference);
    if (existing) return existing;
    await ensureWallet(tx, params.userId, params.currency);
    const locked = await lockWallet(tx, params.userId, params.currency);
    assertCurrencyMatch(locked.currencyCode, params.currency, "deposit");

    const currentBalance = Number(locked.savingsBalance ?? 0);
    const newBalance = currentBalance + netAmount;

    const ledger = await getOrCreateLedger(tx, params.currency);

    const txn = await tx.transaction.create({
      data: {
        userId: params.userId,
        walletId: locked.id,
        ledgerId: ledger.id,
        reference,
        transactionType: "DEPOSIT",
        amount: new Decimal(params.amount),
        fee: new Decimal(fee),
        netAmount: new Decimal(netAmount),
        currency: params.currency,
        status: "COMPLETED",
        completedAt: new Date(),
        metadata: params.metadata as object,
      },
    });

    await tx.wallet.update({
      where: { id: locked.id },
      data: {
        balance: { increment: netAmount },
        availableBalance: { increment: netAmount },
        savingsBalance: { increment: netAmount },
        lastTransactionAt: new Date(),
      },
    });

    const ledgerRow = await tx.ledger.findUnique({
      where: { id: ledger.id },
      select: { systemBalance: true },
    });
    const sysBefore = Number(ledgerRow?.systemBalance ?? 0);
    const sysAfter = sysBefore + netAmount;

    await postLedgerEntry(tx, {
      ledgerId: ledger.id,
      transactionId: txn.id,
      currency: params.currency,
      entryType: "DEBIT",
      amount: netAmount,
      balanceAfter: sysAfter,
      accountCode: `ASSET:CUSTODY:${params.currency}`,
      description: `Deposit custody ${params.currency}`,
    });
    await postLedgerEntry(tx, {
      ledgerId: ledger.id,
      transactionId: txn.id,
      currency: params.currency,
      entryType: "CREDIT",
      amount: netAmount,
      balanceAfter: newBalance,
      accountCode: `LIABILITY:WALLET:${locked.id}`,
      description: `Deposit user liability ${params.currency}`,
    });
    await updateLedgerBalance(tx, ledger.id, netAmount);
    await assertTransactionLedgerBalanced(tx, txn.id);
    await sealTransactionLedgerChain(tx, txn.id, ledger.id);

    return { transactionId: txn.id, reference, newBalance };
  });
}

export interface WithdrawParams {
  userId: string;
  currency: CurrencyCode;
  amount: number;
  fee?: number;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface WithdrawResult {
  transactionId: string;
  reference: string;
  newBalance: number;
}

/**
 * Withdrawal: ONLY affects the specified currency wallet + ledger.
 */
export async function processWithdrawal(params: WithdrawParams): Promise<WithdrawResult> {
  await validateCurrencyActive(params.currency);
  assertPositiveAmount(params.amount, "amount");
  const fee = params.fee ?? 0;
  const totalDeduct = params.amount + fee;
  const reference = params.reference ?? generateReference();

  return prisma.$transaction(async (tx) => {
    const existing = await checkIdempotency(tx, reference);
    if (existing) return existing;

    const locked = await lockWallet(tx, params.userId, params.currency);
    assertCurrencyMatch(locked.currencyCode, params.currency, "withdrawal");

    const available = calculateAvailableForWithdrawal(locked.savingsBalance, locked.activeLoanBalance);
    if (available < totalDeduct) {
      throw validationError(
        `Insufficient balance. Available: ${available.toFixed(2)}, requested: ${totalDeduct.toFixed(2)}`
      );
    }

    const currentBalance = locked.savingsBalance;
    const newBalance = currentBalance - totalDeduct;
    const ledger = await getOrCreateLedger(tx, params.currency);

    const txn = await tx.transaction.create({
      data: {
        userId: params.userId,
        walletId: locked.id,
        ledgerId: ledger.id,
        reference,
        transactionType: "WITHDRAWAL",
        amount: new Decimal(params.amount),
        fee: new Decimal(fee),
        netAmount: new Decimal(-totalDeduct),
        currency: params.currency,
        status: "COMPLETED",
        completedAt: new Date(),
        metadata: params.metadata as object,
      },
    });

    await tx.wallet.update({
      where: { id: locked.id },
      data: {
        balance: { decrement: totalDeduct },
        availableBalance: { decrement: totalDeduct },
        savingsBalance: { decrement: totalDeduct },
        lastTransactionAt: new Date(),
      },
    });

    const wLedgerRow = await tx.ledger.findUnique({
      where: { id: ledger.id },
      select: { systemBalance: true },
    });
    const wSysBefore = Number(wLedgerRow?.systemBalance ?? 0);
    const wSysAfter = wSysBefore - totalDeduct;

    await postLedgerEntry(tx, {
      ledgerId: ledger.id,
      transactionId: txn.id,
      currency: params.currency,
      entryType: "DEBIT",
      amount: totalDeduct,
      balanceAfter: newBalance,
      accountCode: `LIABILITY:WALLET:${locked.id}`,
      description: `Withdrawal user liability ${params.currency}`,
    });
    await postLedgerEntry(tx, {
      ledgerId: ledger.id,
      transactionId: txn.id,
      currency: params.currency,
      entryType: "CREDIT",
      amount: totalDeduct,
      balanceAfter: wSysAfter,
      accountCode: `ASSET:CUSTODY:${params.currency}`,
      description: `Withdrawal custody release ${params.currency}`,
    });
    await updateLedgerBalance(tx, ledger.id, -totalDeduct);
    await assertTransactionLedgerBalanced(tx, txn.id);
    await sealTransactionLedgerChain(tx, txn.id, ledger.id);

    return { transactionId: txn.id, reference, newBalance };
  });
}

/**
 * Lock multiple wallets in deterministic order to prevent deadlocks.
 * Sorts by (userId, currency) before locking. Returns in same order as input keys.
 */
async function lockMultipleWallets(
  tx: TxClient,
  keys: Array<{ userId: string; currency: CurrencyCode }>
): Promise<Map<string, { id: string; savingsBalance: number; activeLoanBalance: number; currencyCode: CurrencyCode }>> {
  const sorted = [...keys].sort((a, b) => {
    const u = a.userId.localeCompare(b.userId);
    if (u !== 0) return u;
    return a.currency.localeCompare(b.currency);
  });
  const map = new Map<string, { id: string; savingsBalance: number; activeLoanBalance: number; currencyCode: CurrencyCode }>();
  for (const { userId, currency } of sorted) {
    const locked = await lockWallet(tx, userId, currency);
    map.set(`${userId}:${currency}`, locked);
  }
  return map;
}

export interface TransferParams {
  fromUserId: string;
  toUserId: string;
  currency: CurrencyCode;
  amount: number;
  fee?: number;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface TransferResult {
  transactionId: string;
  reference: string;
  fromNewBalance: number;
  toNewBalance: number;
}

/**
 * Transfer between users - ONLY affects same currency wallets.
 * Locks both wallets in deterministic order to prevent deadlocks.
 */
export async function processTransfer(params: TransferParams): Promise<TransferResult> {
  await validateCurrencyActive(params.currency);
  assertPositiveAmount(params.amount, "amount");
  const fee = params.fee ?? 0;
  const netAmount = params.amount - fee;
  const reference = params.reference ?? generateReference();

  if (params.fromUserId === params.toUserId) {
    throw validationError("Cannot transfer to self");
  }

  return prisma.$transaction(async (tx) => {
    const existing = await checkIdempotency(tx, reference);
    if (existing) {
      const fromWallet = await tx.wallet.findFirst({
        where: { userId: params.fromUserId, currencyCode: params.currency },
        select: { savingsBalance: true },
      });
      const toWallet = await tx.wallet.findFirst({
        where: { userId: params.toUserId, currencyCode: params.currency },
        select: { savingsBalance: true },
      });
      return {
        transactionId: existing.transactionId,
        reference: existing.reference,
        fromNewBalance: Number(fromWallet?.savingsBalance ?? 0),
        toNewBalance: Number(toWallet?.savingsBalance ?? 0),
      };
    }

    // Ensure recipient has wallet (create if first receipt)
    await ensureWallet(tx, params.toUserId, params.currency);

    const lockedMap = await lockMultipleWallets(tx, [
      { userId: params.fromUserId, currency: params.currency },
      { userId: params.toUserId, currency: params.currency },
    ]);
    const fromWallet = lockedMap.get(`${params.fromUserId}:${params.currency}`);
    const toWallet = lockedMap.get(`${params.toUserId}:${params.currency}`);
    if (!fromWallet || !toWallet) throw validationError("One or both wallets not found");

    assertCurrencyMatch(fromWallet.currencyCode, params.currency, "transfer (from)");
    assertCurrencyMatch(toWallet.currencyCode, params.currency, "transfer (to)");

    const available = calculateAvailableForWithdrawal(fromWallet.savingsBalance, fromWallet.activeLoanBalance);
    if (available < params.amount + fee) {
      throw validationError(
        `Insufficient balance. Available: ${available.toFixed(2)}, requested: ${(params.amount + fee).toFixed(2)}`
      );
    }

    const fromNewBalance = fromWallet.savingsBalance - params.amount - fee;
    const toNewBalance = toWallet.savingsBalance + netAmount;

    const ledger = await getOrCreateLedger(tx, params.currency);

    const txn = await tx.transaction.create({
      data: {
        userId: params.fromUserId,
        walletId: fromWallet.id,
        ledgerId: ledger.id,
        reference,
        transactionType: "TRANSFER",
        amount: new Decimal(params.amount),
        fee: new Decimal(fee),
        netAmount: new Decimal(-params.amount - fee),
        currency: params.currency,
        status: "COMPLETED",
        completedAt: new Date(),
        metadata: {
          ...(params.metadata as object),
          toUserId: params.toUserId,
          toWalletId: toWallet.id,
        },
      },
    });

    await tx.wallet.update({
      where: { id: fromWallet.id },
      data: {
        balance: { decrement: params.amount + fee },
        availableBalance: { decrement: params.amount + fee },
        savingsBalance: { decrement: params.amount + fee },
        lastTransactionAt: new Date(),
      },
    });
    await tx.wallet.update({
      where: { id: toWallet.id },
      data: {
        balance: { increment: netAmount },
        availableBalance: { increment: netAmount },
        savingsBalance: { increment: netAmount },
        lastTransactionAt: new Date(),
      },
    });

    const grossOut = params.amount + fee;
    await postLedgerEntry(tx, {
      ledgerId: ledger.id,
      transactionId: txn.id,
      currency: params.currency,
      entryType: "DEBIT",
      amount: grossOut,
      balanceAfter: fromNewBalance,
      accountCode: `LIABILITY:WALLET:${fromWallet.id}`,
      description: `Transfer out to user ${params.toUserId}`,
    });
    if (fee > 0) {
      const feeToPlatform = 2 * fee;
      await postLedgerEntry(tx, {
        ledgerId: ledger.id,
        transactionId: txn.id,
        currency: params.currency,
        entryType: "CREDIT",
        amount: netAmount,
        balanceAfter: toNewBalance,
        accountCode: `LIABILITY:WALLET:${toWallet.id}`,
        description: `Transfer in from user ${params.fromUserId}`,
      });
      await postLedgerEntry(tx, {
        ledgerId: ledger.id,
        transactionId: txn.id,
        currency: params.currency,
        entryType: "CREDIT",
        amount: feeToPlatform,
        balanceAfter: feeToPlatform,
        accountCode: `INCOME:FEE_TRANSFER:${params.currency}`,
        description: `Internal transfer fee allocation`,
      });
    } else {
      await postLedgerEntry(tx, {
        ledgerId: ledger.id,
        transactionId: txn.id,
        currency: params.currency,
        entryType: "CREDIT",
        amount: netAmount,
        balanceAfter: toNewBalance,
        accountCode: `LIABILITY:WALLET:${toWallet.id}`,
        description: `Transfer in from user ${params.fromUserId}`,
      });
    }
    await assertTransactionLedgerBalanced(tx, txn.id);
    await sealTransactionLedgerChain(tx, txn.id, ledger.id);

    return {
      transactionId: txn.id,
      reference,
      fromNewBalance,
      toNewBalance,
    };
  });
}
