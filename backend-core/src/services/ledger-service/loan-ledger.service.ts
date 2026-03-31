/**
 * Loan disbursement & repayment — strictly double-entry + seal (no direct balance-only posts).
 */

import type { CurrencyCode, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { recordEntry } from "./ledger.service.js";
import { getOrCreateLedger } from "./ledger.service.js";
import { updateLedgerBalance } from "./ledger.service.js";
import { assertTransactionLedgerBalanced } from "../../infrastructure/ledger/double-entry.js";
import { sealTransactionLedgerChain } from "./ledger-hash.service.js";
import { validationError } from "../../middlewares/errorHandler.js";

type Tx = Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

function assetCustody(currency: CurrencyCode): string {
  return `ASSET:CUSTODY:${currency}`;
}

export function liabilityApprovedCredit(walletId: string): string {
  return `LIABILITY:APPROVED_CREDIT:${walletId}`;
}

export function liabilityActiveLoan(walletId: string): string {
  return `LIABILITY:ACTIVE_LOAN:${walletId}`;
}

/**
 * One sealed journal: DR custody (P+T) = CR approved (P) + CR active loan (T).
 * Matches wallet increments: approvedCreditBalance += P, activeLoanBalance += T.
 */
export async function postLoanDisbursementLedger(
  tx: Tx,
  params: {
    userId: string;
    walletId: string;
    currency: CurrencyCode;
    principal: number;
    totalRepayable: number;
    reference: string;
    loanId: string;
    creditType?: string;
  }
): Promise<{ transactionId: string }> {
  const { principal: P, totalRepayable: T } = params;
  if (P <= 0 || T <= 0) {
    throw validationError("Principal and total repayable must be positive");
  }
  const gross = P + T;
  const ledger = await getOrCreateLedger(params.currency, tx);

  const txn = await tx.transaction.create({
    data: {
      userId: params.userId,
      walletId: params.walletId,
      ledgerId: ledger.id,
      reference: params.reference,
      transactionType: "LOAN_DISBURSEMENT",
      amount: new Decimal(P),
      fee: new Decimal(0),
      netAmount: new Decimal(gross),
      currency: params.currency,
      status: "COMPLETED",
      completedAt: new Date(),
      metadata: { loanId: params.loanId, creditType: params.creditType } as object,
    },
  });

  const sysBefore = Number((await tx.ledger.findUnique({ where: { id: ledger.id }, select: { systemBalance: true } }))?.systemBalance ?? 0);
  const sysAfter = sysBefore + gross;

  await recordEntry(tx, {
    ledgerId: ledger.id,
    transactionId: txn.id,
    currencyCode: params.currency,
    entryType: "DEBIT",
    amount: gross,
    balanceAfter: sysAfter,
    accountCode: assetCustody(params.currency),
    description: `Loan disbursement custody gross ${gross} ${params.currency}`,
  });
  const wAfter = await tx.wallet.findUnique({
    where: { id: params.walletId },
    select: { approvedCreditBalance: true, activeLoanBalance: true },
  });
  const ap = Number(wAfter?.approvedCreditBalance ?? 0);
  const al = Number(wAfter?.activeLoanBalance ?? 0);

  await recordEntry(tx, {
    ledgerId: ledger.id,
    transactionId: txn.id,
    currencyCode: params.currency,
    entryType: "CREDIT",
    amount: P,
    balanceAfter: ap,
    accountCode: liabilityApprovedCredit(params.walletId),
    description: `Approved credit line ${params.currency}`,
  });
  await recordEntry(tx, {
    ledgerId: ledger.id,
    transactionId: txn.id,
    currencyCode: params.currency,
    entryType: "CREDIT",
    amount: T,
    balanceAfter: al,
    accountCode: liabilityActiveLoan(params.walletId),
    description: `Active loan obligation ${params.currency}`,
  });

  await updateLedgerBalance(tx, ledger.id, gross);
  await assertTransactionLedgerBalanced(tx, txn.id);
  await sealTransactionLedgerChain(tx, txn.id, ledger.id);

  return { transactionId: txn.id };
}

export async function postLoanRepaymentLedger(
  tx: Tx,
  params: {
    userId: string;
    walletId: string;
    currency: CurrencyCode;
    amount: number;
    reference: string;
    deductFromWallet: boolean;
    method: string;
    /** Wallet.activeLoanBalance after repayment */
    walletActiveLoanAfter: number;
    /** Wallet.savingsBalance after repayment (from-wallet path only) */
    walletSavingsAfter?: number;
  }
): Promise<{ transactionId: string }> {
  const R = params.amount;
  const ledger = await getOrCreateLedger(params.currency, tx);

  const txn = await tx.transaction.create({
    data: {
      userId: params.userId,
      walletId: params.walletId,
      ledgerId: ledger.id,
      reference: params.reference,
      transactionType: "LOAN_REPAYMENT",
      amount: new Decimal(R),
      fee: new Decimal(0),
      netAmount: new Decimal(R),
      currency: params.currency,
      status: "COMPLETED",
      completedAt: new Date(),
      metadata: { method: params.method, deductFromWallet: params.deductFromWallet } as object,
    },
  });

  const ledgerRow = await tx.ledger.findUnique({
    where: { id: ledger.id },
    select: { systemBalance: true },
  });
  const sysBefore = Number(ledgerRow?.systemBalance ?? 0);

  if (params.deductFromWallet) {
    if (params.walletSavingsAfter === undefined) {
      throw validationError("walletSavingsAfter required when deductFromWallet");
    }
    const sav = params.walletSavingsAfter;
    await recordEntry(tx, {
      ledgerId: ledger.id,
      transactionId: txn.id,
      currencyCode: params.currency,
      entryType: "DEBIT",
      amount: R,
      balanceAfter: params.walletActiveLoanAfter,
      accountCode: liabilityActiveLoan(params.walletId),
      description: `Reduce loan obligation ${params.currency}`,
    });
    await recordEntry(tx, {
      ledgerId: ledger.id,
      transactionId: txn.id,
      currencyCode: params.currency,
      entryType: "CREDIT",
      amount: R,
      balanceAfter: sav,
      accountCode: `LIABILITY:WALLET:${params.walletId}`,
      description: `Loan repayment from wallet ${params.currency}`,
    });
    await updateLedgerBalance(tx, ledger.id, 0);
  } else {
    const sysAfter = sysBefore + R;
    await recordEntry(tx, {
      ledgerId: ledger.id,
      transactionId: txn.id,
      currencyCode: params.currency,
      entryType: "DEBIT",
      amount: R,
      balanceAfter: params.walletActiveLoanAfter,
      accountCode: liabilityActiveLoan(params.walletId),
      description: `Reduce loan obligation ${params.currency}`,
    });
    await recordEntry(tx, {
      ledgerId: ledger.id,
      transactionId: txn.id,
      currencyCode: params.currency,
      entryType: "CREDIT",
      amount: R,
      balanceAfter: sysAfter,
      accountCode: assetCustody(params.currency),
      description: `Loan repayment external inflow ${params.currency}`,
    });
    await updateLedgerBalance(tx, ledger.id, R);
  }

  await assertTransactionLedgerBalanced(tx, txn.id);
  await sealTransactionLedgerChain(tx, txn.id, ledger.id);

  return { transactionId: txn.id };
}
