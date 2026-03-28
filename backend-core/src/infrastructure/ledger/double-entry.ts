/**
 * Double-entry invariant: for a given Transaction, sum(DEBIT amounts) === sum(CREDIT amounts).
 */

import type { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { validationError } from "../../middlewares/errorHandler.js";

type Tx = Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

const EPS = new Decimal("0.00000001");

export async function assertTransactionLedgerBalanced(tx: Tx, transactionId: string): Promise<void> {
  const rows = await tx.ledgerEntry.findMany({
    where: { transactionId },
    select: { entryType: true, amount: true },
  });
  if (rows.length === 0) {
    throw validationError("Double-entry: no ledger entries for transaction");
  }
  let debit = new Decimal(0);
  let credit = new Decimal(0);
  for (const r of rows) {
    const a = new Decimal(r.amount);
    if (r.entryType === "DEBIT") debit = debit.plus(a);
    else if (r.entryType === "CREDIT") credit = credit.plus(a);
  }
  const diff = debit.minus(credit).abs();
  if (diff.gt(EPS)) {
    throw validationError(
      `Double-entry violation: DR ${debit.toFixed(8)} ≠ CR ${credit.toFixed(8)} (tx ${transactionId})`
    );
  }
}
