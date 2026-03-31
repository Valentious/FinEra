/**
 * Verifies per-ledger hash chain and recomputed journal seals.
 */

import { prisma } from "../../infrastructure/database/index.js";
import { GENESIS, sha256Hex, buildLedgerSealPayload } from "../../infrastructure/ledger/hash-chain.js";

export async function runLedgerIntegrityCheck(ledgerId?: string): Promise<{
  ok: boolean;
  ledgersChecked: number;
  transactionsChecked: number;
  errors: { transactionId: string; message: string }[];
}> {
  const errors: { transactionId: string; message: string }[] = [];
  let transactionsChecked = 0;

  const ledgers = ledgerId
    ? [await prisma.ledger.findUnique({ where: { id: ledgerId } })]
    : await prisma.ledger.findMany({ select: { id: true } });

  let ledgersChecked = 0;

  for (const ledger of ledgers) {
    if (!ledger) continue;
    ledgersChecked++;
    const txs = await prisma.transaction.findMany({
      where: { ledgerId: ledger.id, ledgerEntryHash: { not: null } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        currency: true,
        createdAt: true,
        ledgerPreviousHash: true,
        ledgerEntryHash: true,
      },
    });

    let expectedPrev = GENESIS;
    for (const txn of txs) {
      transactionsChecked++;
      if (txn.ledgerPreviousHash !== expectedPrev) {
        errors.push({
          transactionId: txn.id,
          message: `Chain previous mismatch: expected ${expectedPrev}, got ${txn.ledgerPreviousHash ?? "null"}`,
        });
      }

      const entries = await prisma.ledgerEntry.findMany({
        where: { transactionId: txn.id },
        orderBy: [{ entryType: "asc" }, { id: "asc" }],
      });
      const entryCanonical = entries
        .map((e) => `${e.entryType}:${e.accountCode}:${e.amount.toString()}`)
        .join(";");
      const payload = buildLedgerSealPayload({
        previousHash: txn.ledgerPreviousHash ?? GENESIS,
        transactionId: txn.id,
        userId: txn.userId,
        currency: txn.currency,
        entryCanonical,
        createdAtIso: txn.createdAt.toISOString(),
      });
      const h = sha256Hex(payload);
      if (h !== txn.ledgerEntryHash) {
        errors.push({ transactionId: txn.id, message: "Journal hash recomputation mismatch" });
      }
      expectedPrev = txn.ledgerEntryHash!;
    }
  }

  return {
    ok: errors.length === 0,
    ledgersChecked,
    transactionsChecked,
    errors,
  };
}
