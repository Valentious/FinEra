/**
 * FinEra structured account numbers (digits only).
 * Format: [SystemCode 2][Year 4][CurrencySlot 2][Sequence 12] = 20 digits.
 *
 * Currency slots: USD=00, ZIG=01, ZAR=02, EUR=03, GBP=04
 * Slot 98 = custody / omnibus per currency ledger.
 */

import type { CurrencyCode } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export const SYSTEM_CODE = "10";
export const CUSTODY_CURRENCY_SLOT = "98";

const CURRENCY_SLOT: Record<CurrencyCode, string> = {
  USD: "00",
  ZIG: "01",
  ZAR: "02",
  EUR: "03",
  GBP: "04",
};

const SEQ_LEN = 12;
const EXPECTED_LEN = 20;

export function formatStructuredAccountNumber(
  year: number,
  currencySlot: string,
  sequence: bigint | number
): string {
  const y = String(year);
  if (y.length !== 4) throw new Error("year must be four digits");
  const seq = typeof sequence === "bigint" ? sequence : BigInt(sequence);
  const seqStr = seq.toString().padStart(SEQ_LEN, "0");
  if (seqStr.length > SEQ_LEN) {
    throw new Error("Account sequence overflow");
  }
  const digits = `${SYSTEM_CODE}${y}${currencySlot}${seqStr}`;
  if (digits.length !== EXPECTED_LEN) {
    throw new Error(`Invalid account number length: ${digits.length}`);
  }
  if (!/^\d+$/.test(digits)) {
    throw new Error("Account number must be digits only");
  }
  return digits;
}

export function currencySlotForCode(cc: CurrencyCode): string {
  return CURRENCY_SLOT[cc];
}

type Tx = Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

/** Atomic monotonic sequence (row locked in the surrounding transaction). */
export async function allocateAccountSequence(tx: Tx): Promise<bigint> {
  // Idempotent bootstrap for environments created via db push/baseline
  // where this helper table may not exist yet.
  await tx.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "account_number_sequence" (
      "id" text PRIMARY KEY,
      "next" bigint NOT NULL DEFAULT 0
    )
  `);

  await tx.$executeRaw`
    INSERT INTO "account_number_sequence" ("id", "next")
    VALUES ('global', 0)
    ON CONFLICT ("id") DO NOTHING
  `;
  const rows = await tx.$queryRaw<[{ next: bigint }]>`
    UPDATE "account_number_sequence"
    SET "next" = "next" + 1
    WHERE "id" = 'global'
    RETURNING "next"
  `;
  const v = rows[0]?.next;
  if (v === undefined || v === null) {
    throw new Error("Failed to allocate account sequence");
  }
  return BigInt(v);
}

export async function allocateUserAccountNumber(tx: Tx, currency: CurrencyCode): Promise<string> {
  const year = new Date().getUTCFullYear();
  const slot = currencySlotForCode(currency);
  const seq = await allocateAccountSequence(tx);
  return formatStructuredAccountNumber(year, slot, seq);
}

export async function allocateCustodyAccountNumber(tx: Tx): Promise<string> {
  const year = new Date().getUTCFullYear();
  const seq = await allocateAccountSequence(tx);
  return formatStructuredAccountNumber(year, CUSTODY_CURRENCY_SLOT, seq);
}
