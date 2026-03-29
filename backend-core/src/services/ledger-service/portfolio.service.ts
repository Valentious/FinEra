/**
 * FinEra Backend - Portfolio Service
 * Portfolio calculations derived from transaction history and wallet balances.
 */

import { prisma } from "../../infrastructure/database/index.js";
import type { CurrencyCode } from "@prisma/client";
import { getWalletLabel } from "../../shared/wallet-label.js";

export interface PortfolioSummary {
  userId: string;
  currencyCode: CurrencyCode;
  walletLabel: string;
  totalBalance: number;
  activeCredit: number;
  approvedCredit: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalRepaid: number;
  availableForWithdrawal: number;
}

/**
 * Calculate portfolio summary from wallet and transaction history.
 */
export async function getPortfolioSummary(
  userId: string,
  currency: CurrencyCode
): Promise<PortfolioSummary> {
  const wallet = await prisma.wallet.findFirst({
    where: { userId, currencyCode: currency },
  });

  if (!wallet) {
    return {
      userId,
      currencyCode: currency,
      walletLabel: getWalletLabel(currency),
      totalBalance: 0,
      activeCredit: 0,
      approvedCredit: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      totalRepaid: 0,
      availableForWithdrawal: 0,
    };
  }

  const [depositAgg, withdrawAgg, repayAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId,
        walletId: wallet.id,
        transactionType: "DEPOSIT",
        status: "COMPLETED",
      },
      _sum: { netAmount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        walletId: wallet.id,
        transactionType: "WITHDRAWAL",
        status: "COMPLETED",
      },
      _sum: { netAmount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        walletId: wallet.id,
        transactionType: "LOAN_REPAYMENT",
        status: "COMPLETED",
      },
      _sum: { netAmount: true },
    }),
  ]);

  const totalDeposited = Number(depositAgg._sum.netAmount ?? 0);
  const totalWithdrawn = Number(withdrawAgg._sum.netAmount ?? 0);
  const totalRepaid = Number(repayAgg._sum.netAmount ?? 0);
  const walletBal = Number(wallet.balance);
  const activeLoanBalance = Number(wallet.activeLoanBalance);

  const availableForWithdrawal =
    activeLoanBalance > 0 ? walletBal * 0.8 : walletBal;

  return {
    userId,
    currencyCode: currency,
    walletLabel: getWalletLabel(currency),
    totalBalance: walletBal,
    activeCredit: activeLoanBalance,
    approvedCredit: Number(wallet.approvedCreditBalance),
    totalDeposited,
    totalWithdrawn,
    totalRepaid,
    availableForWithdrawal: Math.max(0, availableForWithdrawal),
  };
}

/**
 * Record a portfolio snapshot for historical tracking.
 */
export async function recordPortfolioSnapshot(
  userId: string,
  currency: CurrencyCode,
  snapshotDate: Date
): Promise<void> {
  const summary = await getPortfolioSummary(userId, currency);
  const dateOnly = new Date(snapshotDate.toISOString().slice(0, 10));

  await prisma.portfolioSnapshot.upsert({
    where: {
      userId_snapshotDate_currencyCode: {
        userId,
        snapshotDate: dateOnly,
        currencyCode: currency,
      },
    },
    create: {
      userId,
      snapshotDate: dateOnly,
      currencyCode: currency,
      totalSavings: summary.totalBalance,
      activeCredit: summary.activeCredit,
      approvedCredit: summary.approvedCredit,
      totalDeposited: summary.totalDeposited,
      totalWithdrawn: summary.totalWithdrawn,
      totalRepaid: summary.totalRepaid,
    },
    update: {
      totalSavings: summary.totalBalance,
      activeCredit: summary.activeCredit,
      approvedCredit: summary.approvedCredit,
      totalDeposited: summary.totalDeposited,
      totalWithdrawn: summary.totalWithdrawn,
      totalRepaid: summary.totalRepaid,
    },
  });
}
