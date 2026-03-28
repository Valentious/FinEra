/**
 * Atomic creation: one Wallet per (user, currency). Balances live on Wallet (schema).
 * Call inside prisma.$transaction.
 */

import type { CurrencyCode } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { allocateUserAccountNumber } from "../../infrastructure/ledger/account-number.js";

type Tx = Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

const zeroBalances = {
  balance: 0,
  availableBalance: 0,
  holdBalance: 0,
  savingsBalance: 0,
  approvedCreditBalance: 0,
  savingsGoal: null as null,
  activeLoanBalance: 0,
  totalLoanAmount: 0,
  totalRepaidAmount: 0,
  dailyTransactionTotal: 0,
  dailyTransactionCount: 0,
  monthlyTransactionTotal: 0,
};

export async function createUserCurrencyAccountStack(
  tx: Tx,
  userId: string,
  currency: CurrencyCode
): Promise<{ walletId: string; accountNumber: string }> {
  const accountNumber = await allocateUserAccountNumber(tx, currency);

  const wallet = await tx.wallet.create({
    data: {
      userId,
      currencyCode: currency,
      accountNumber,
      ...zeroBalances,
      status: "active",
      isActive: true,
    },
  });

  return {
    walletId: wallet.id,
    accountNumber,
  };
}
