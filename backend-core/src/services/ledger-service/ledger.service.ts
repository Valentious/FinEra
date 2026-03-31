/**
 * FinEra - Ledger Service
 *
 * Single source for ledger operations. Each currency has its own ledger - never mixed.
 * Append-only ledger entries. Every balance change MUST have a ledger entry.
 */

import { prisma } from "../../infrastructure/database/index.js";
import type { CurrencyCode } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { getActiveCurrencies } from "./currency.config.js";

type TxClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Get or create ledger for currency. Sets ledgerName per spec (e.g. USD_MAIN_LEDGER).
 */
export async function getOrCreateLedger(
  currencyCode: CurrencyCode,
  tx: TxClient = prisma
): Promise<{ id: string; ledgerName: string }> {
  let ledger = await tx.ledger.findUnique({ where: { currencyCode } });
  if (!ledger) {
    const ledgerName = `${currencyCode}_MAIN_LEDGER`;
    ledger = await tx.ledger.create({
      data: {
        currencyCode,
        ledgerName,
        ledgerType: "CUSTODY",
        systemBalance: 0,
      },
    });
  }
  return {
    id: ledger.id,
    ledgerName: ledger.ledgerName ?? `${currencyCode}_MAIN_LEDGER`,
  };
}

/**
 * recordEntry - Append-only ledger entry. MUST be called for every balance change.
 */
export async function recordEntry(
  tx: TxClient,
  params: {
    ledgerId: string;
    transactionId: string;
    currencyCode: CurrencyCode;
    entryType: "DEBIT" | "CREDIT";
    amount: number;
    balanceAfter: number;
    accountCode: string;
    description?: string;
  }
): Promise<void> {
  await tx.ledgerEntry.create({
    data: {
      ledgerId: params.ledgerId,
      transactionId: params.transactionId,
      currencyCode: params.currencyCode,
      entryType: params.entryType,
      accountCode: params.accountCode,
      amount: new Decimal(params.amount),
      balanceAfter: new Decimal(params.balanceAfter),
      description: params.description ?? null,
    },
  });
}

/**
 * Update ledger systemBalance (running total).
 */
export async function updateLedgerBalance(
  tx: TxClient,
  ledgerId: string,
  delta: number
): Promise<void> {
  await tx.ledger.update({
    where: { id: ledgerId },
    data: { systemBalance: { increment: delta } },
  });
}

/**
 * Initialize ledger for a currency.
 */
export async function initializeLedgers(currencyCode: CurrencyCode): Promise<void> {
  await getOrCreateLedger(currencyCode);
}

/**
 * Initialize ledgers for all active currencies (from CurrencyRegistry).
 */
export async function initializeAllLedgers(): Promise<void> {
  const currencies = await getActiveCurrencies();
  for (const currency of currencies) {
    await initializeLedgers(currency);
  }
}

/**
 * Get ledger balance from systemBalance field.
 */
export async function getLedgerBalance(currencyCode: CurrencyCode): Promise<number> {
  const ledger = await prisma.ledger.findUnique({
    where: { currencyCode },
  });
  if (!ledger) return 0;
  return Number(ledger.systemBalance);
}

/**
 * Get total wallet balance for a currency (active wallets only).
 */
export async function getTotalWalletBalance(currencyCode: CurrencyCode): Promise<number> {
  const result = await prisma.wallet.aggregate({
    where: {
      currencyCode,
      isActive: true,
      status: "active",
    },
    _sum: { balance: true },
  });
  return Number(result._sum.balance ?? 0);
}

/**
 * Verify that wallet balances match custody ledger for a currency.
 */
export async function verifyLedgerConsistency(currencyCode: CurrencyCode): Promise<{
  currency: CurrencyCode;
  walletTotal: number;
  custodyBalance: number;
  isConsistent: boolean;
  drift?: number;
}> {
  const walletTotal = await getTotalWalletBalance(currencyCode);
  const custodyBalance = await getLedgerBalance(currencyCode);
  const drift = Math.abs(walletTotal - custodyBalance);
  const isConsistent = drift < 0.00000001; // Allow for floating point tolerance

  return {
    currency: currencyCode,
    walletTotal,
    custodyBalance,
    isConsistent,
    ...(drift >= 0.00000001 ? { drift } : {}),
  };
}

/**
 * Verify consistency for all active currencies.
 */
export async function verifyAllLedgers(): Promise<
  Array<{
    currency: CurrencyCode;
    walletTotal: number;
    custodyBalance: number;
    isConsistent: boolean;
    drift?: number;
  }>
> {
  const currencies = await getActiveCurrencies();
  const results = await Promise.all(currencies.map((c) => verifyLedgerConsistency(c)));
  return results;
}
