/**
 * FinEra Backend - Credit Service
 * Orchestrates domain engines: CreditScoreEngine, CreditLimitEngine, InterestRateEngine
 */

import { prisma } from "../../infrastructure/database/index.js";
import { CreditScoreEngine } from "../../domain/services/credit-score.service.js";
import { CreditLimitEngine } from "../../domain/services/credit-limit.service.js";
import { InterestRateEngine } from "../../domain/services/interest-rate.service.js";
const scoreEngine = new CreditScoreEngine();
const limitEngine = new CreditLimitEngine();
const interestEngine = new InterestRateEngine();

export interface CreditScoreFactors {
  repaymentReliability: number;
  savingsConsistency: number;
  transactionHealth: number;
  accountLongevity: number;
  kycLevelBonus: number;
}

export interface CreditLimitResult {
  creditLimit: number;
  availableCredit: number;
  financialDisciplineScore: number;
  factors: CreditScoreFactors;
}

export async function calculateCreditScore(userId: string): Promise<{
  score: number;
  factors: CreditScoreFactors;
}> {
  const { score, components } = await scoreEngine.calculateScore(userId);
  return {
    score,
    factors: {
      repaymentReliability: components.repaymentReliability,
      savingsConsistency: components.savingsConsistency,
      transactionHealth: components.transactionHealth,
      accountLongevity: components.accountLongevity,
      kycLevelBonus: components.kycLevelBonus,
    },
  };
}

export async function calculateCreditLimit(userId: string): Promise<CreditLimitResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { wallets: true, loans: true },
  });
  if (!user) throw new Error("User not found");

  const { score, components } = await scoreEngine.calculateScore(userId);
  const accountAgeDays = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const tierMap: Record<string, number> = { TIER_0: 0, TIER_1: 1, TIER_2: 2, TIER_3: 3 };
  const kycLevel = tierMap[user.accountTier] ?? 0;

  const existingLoansTotal = user.loans
    .filter((l) => l.status === "ACTIVE")
    .reduce((s, l) => s + Number(l.remainingBalance), 0);

  const walletBalances: Record<string, number> = {};
  for (const w of user.wallets) {
    walletBalances[w.currencyCode] = Number(w.balance);
  }

  const creditLimit = limitEngine.calculateCreditLimit({
    userId,
    accountType: user.accountType,
    countryCode: user.countryCode,
    financialDisciplineScore: score,
    existingLoansTotal,
    walletBalances,
    kycLevel,
    accountAgeDays,
  });

  const availableCredit = Math.max(0, creditLimit - existingLoansTotal);

  return {
    creditLimit,
    availableCredit,
    financialDisciplineScore: score,
    factors: {
      repaymentReliability: components.repaymentReliability,
      savingsConsistency: components.savingsConsistency,
      transactionHealth: components.transactionHealth,
      accountLongevity: components.accountLongevity,
      kycLevelBonus: components.kycLevelBonus,
    },
  };
}

export function getInterestRate(
  currency: "USD" | "ZIG" | "ZAR" | "EUR" | "GBP",
  score: number,
  loanAmount: number,
  loanTermMonths: number,
  existingLoansCount: number,
  collateralPresent: boolean
): number {
  return interestEngine.calculateInterestRate({
    userId: "",
    currency,
    loanAmount,
    loanTermMonths,
    financialDisciplineScore: score,
    existingLoansCount,
    collateralPresent,
  });
}
