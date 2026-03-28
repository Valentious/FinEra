/**
 * Single-wallet rule: a loan is bound to exactly ONE Wallet (one currency).
 * Disbursement must never iterate wallets or touch balances outside that wallet.
 */

import type { CurrencyCode, Prisma } from "@prisma/client";
import { validationError } from "../../middlewares/errorHandler.js";
import { logger } from "../../core/utils/logger.js";

type Tx = Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

export function assertLoanCurrencyDefined(currency: CurrencyCode | undefined | null): asserts currency is CurrencyCode {
  if (currency == null || String(currency).trim() === "") {
    throw validationError("Loan currency not defined");
  }
}

export function assertWalletMatchesLoanCurrency(
  wallet: { id: string; currencyCode: CurrencyCode },
  loanCurrency: CurrencyCode
): void {
  if (wallet.currencyCode !== loanCurrency) {
    throw validationError(
      `Wallet currency (${wallet.currencyCode}) does not match loan currency (${loanCurrency})`
    );
  }
}

/** Count LOAN_DISBURSEMENT rows whose metadata.loanId equals this loan (PostgreSQL JSON). */
export async function countDisbursementTransactionsForLoan(tx: Tx, loanId: string): Promise<number> {
  const rows = await tx.$queryRaw<[{ c: bigint }]>`
    SELECT COUNT(*)::bigint AS c
    FROM "Transaction"
    WHERE "transactionType" = 'LOAN_DISBURSEMENT'
      AND (metadata->>'loanId') = ${loanId}
  `;
  return Number(rows[0]?.c ?? 0);
}

/** Before creating the disbursement transaction: must be 0 (no duplicate postings for this loan). */
export async function assertNoDisbursementTransactionForLoan(tx: Tx, loanId: string): Promise<void> {
  const n = await countDisbursementTransactionsForLoan(tx, loanId);
  if (n > 0) {
    logger.warn(
      { audit: "loan_disbursement_duplicate_blocked", loanId, existingDisbursementTransactions: n },
      "Blocked duplicate LOAN_DISBURSEMENT for loan"
    );
    throw validationError("This loan already has a disbursement transaction");
  }
}

/** After creating the disbursement transaction: must be exactly 1. */
export async function assertSingleDisbursementTransactionForLoan(tx: Tx, loanId: string): Promise<void> {
  const n = await countDisbursementTransactionsForLoan(tx, loanId);
  if (n !== 1) {
    logger.error(
      { audit: "loan_disbursement_invariant_violation", loanId, count: n },
      "Invariant: expected exactly one LOAN_DISBURSEMENT per loan"
    );
    throw validationError("Loan disbursement posting invariant failed; contact support");
  }
}
