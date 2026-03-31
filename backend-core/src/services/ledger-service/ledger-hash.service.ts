/**
 * Seals a completed transaction into the per-ledger hash chain.
 * Must run inside the same Prisma transaction after all LedgerEntry rows exist.
 */

import type { Prisma } from "@prisma/client";
import { GENESIS, sha256Hex, buildLedgerSealPayload } from "../../infrastructure/ledger/hash-chain.js";

type Tx = Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

export async function sealTransactionLedgerChain(tx: Tx, transactionId: string, ledgerId: string): Promise<void> {
  const prevRow = await tx.transaction.findFirst({
    where: {
      ledgerId,
      ledgerEntryHash: { not: null },
      NOT: { id: transactionId },
    },
    orderBy: { createdAt: "desc" },
    select: { ledgerEntryHash: true },
  });
  const previousHash = prevRow?.ledgerEntryHash ?? GENESIS;

  const txn = await tx.transaction.findUnique({
    where: { id: transactionId },
    select: { id: true, userId: true, currency: true, createdAt: true },
  });
  if (!txn) throw new Error(`sealTransactionLedgerChain: missing transaction ${transactionId}`);

  const entries = await tx.ledgerEntry.findMany({
    where: { transactionId },
    orderBy: [{ entryType: "asc" }, { id: "asc" }],
  });
  const entryCanonical = entries
    .map((e) => `${e.entryType}:${e.accountCode}:${e.amount.toString()}`)
    .join(";");

  const payload = buildLedgerSealPayload({
    previousHash,
    transactionId: txn.id,
    userId: txn.userId,
    currency: txn.currency,
    entryCanonical,
    createdAtIso: txn.createdAt.toISOString(),
  });
  const ledgerEntryHash = sha256Hex(payload);

  const firstDr = entries.find((e) => e.entryType === "DEBIT");
  const firstCr = entries.find((e) => e.entryType === "CREDIT");

  await tx.transaction.update({
    where: { id: transactionId },
    data: {
      ledgerPreviousHash: previousHash,
      ledgerEntryHash,
      ledgerDebitAccount: firstDr?.accountCode ?? null,
      ledgerCreditAccount: firstCr?.accountCode ?? null,
    },
  });
}
