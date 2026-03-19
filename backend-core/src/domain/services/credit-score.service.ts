/**
 * FinEra - Financial Discipline Score Engine
 * 8-component weighted scoring with mathematical precision
 */

import { prisma } from "../../infrastructure/database/index.js";
import { subMonths, format } from "date-fns";

export interface ScoreComponents {
  repaymentReliability: number;
  savingsConsistency: number;
  transactionHealth: number;
  accountLongevity: number;
  kycLevelBonus: number;
  incomeStability: number;
  crossProductHolding: number;
  referralNetworkHealth: number;
}

const WEIGHTS = {
  repaymentReliability: 0.35,
  savingsConsistency: 0.2,
  transactionHealth: 0.15,
  accountLongevity: 0.1,
  kycLevelBonus: 0.1,
  incomeStability: 0.05,
  crossProductHolding: 0.03,
  referralNetworkHealth: 0.02,
} as const;

export class CreditScoreEngine {
  async calculateScore(userId: string): Promise<{ score: number; components: ScoreComponents }> {
    const [
      repaymentData,
      savingsData,
      transactionData,
      accountData,
      kycData,
      incomeData,
      crossProductData,
      referralData,
    ] = await Promise.all([
      this.calculateRepaymentReliability(userId),
      this.calculateSavingsConsistency(userId),
      this.calculateTransactionHealth(userId),
      this.calculateAccountLongevity(userId),
      this.calculateKycLevelBonus(userId),
      this.calculateIncomeStability(userId),
      this.calculateCrossProductHolding(userId),
      this.calculateReferralNetworkHealth(userId),
    ]);

    const components: ScoreComponents = {
      repaymentReliability: repaymentData.score,
      savingsConsistency: savingsData.score,
      transactionHealth: transactionData.score,
      accountLongevity: accountData.score,
      kycLevelBonus: kycData.score,
      incomeStability: incomeData.score,
      crossProductHolding: crossProductData.score,
      referralNetworkHealth: referralData.score,
    };

    let weightedScore = 0;
    for (const [key, weight] of Object.entries(WEIGHTS)) {
      weightedScore += components[key as keyof ScoreComponents] * weight;
    }

    weightedScore = this.applyRiskModifiers(weightedScore, components);
    const finalScore = Math.min(100, Math.max(0, Math.round(weightedScore)));

    await this.saveScore(userId, finalScore, components);

    return { score: finalScore, components };
  }

  private async calculateRepaymentReliability(userId: string): Promise<{ score: number }> {
    const twentyFourMonthsAgo = subMonths(new Date(), 24);
    const repayments = await prisma.repayment.findMany({
      where: { userId, scheduledDate: { gte: twentyFourMonthsAgo } },
      orderBy: { scheduledDate: "desc" },
    });

    if (repayments.length === 0) return { score: 50 };

    const total = repayments.length;
    const onTime = repayments.filter((r) => r.paidOnTime).length;
    const late = repayments.filter((r) => (r.daysLate ?? 0) > 0 && (r.daysLate ?? 0) <= 30).length;
    const defaulted = repayments.filter((r) => (r.daysLate ?? 0) > 90).length;

    let baseScore = (onTime / total) * 100;
    if (defaulted > 0) baseScore *= Math.max(0, 1 - defaulted * 0.3);
    if (late > 0) baseScore *= Math.max(0, 1 - late * 0.05);
    if (onTime === total && total >= 12) baseScore = Math.min(100, baseScore * 1.1);

    return { score: Math.round(baseScore) };
  }

  private async calculateSavingsConsistency(userId: string): Promise<{ score: number }> {
    const twelveMonthsAgo = subMonths(new Date(), 12);
    const deposits = await prisma.transaction.findMany({
      where: {
        userId,
        transactionType: "DEPOSIT",
        createdAt: { gte: twelveMonthsAgo },
      },
    });

    const byMonth = new Map<string, number>();
    for (const tx of deposits) {
      const key = format(tx.createdAt, "yyyy-MM");
      const amt = Number(tx.amount);
      byMonth.set(key, (byMonth.get(key) ?? 0) + amt);
    }

    const monthsWithSavings = Array.from(byMonth.values()).filter((a) => a >= 10).length;
    let consistencyScore = (monthsWithSavings / 12) * 100;

    if (byMonth.size >= 6) {
      const amounts = Array.from(byMonth.values()).slice(-6);
      const isIncreasing = amounts.every((v, i) => i === 0 || v >= amounts[i - 1] * 0.9);
      if (isIncreasing) consistencyScore = Math.min(100, consistencyScore + 10);
    }

    return { score: Math.round(consistencyScore) };
  }

  private async calculateTransactionHealth(userId: string): Promise<{ score: number }> {
    const sixMonthsAgo = subMonths(new Date(), 6);
    const txns = await prisma.transaction.findMany({
      where: { userId, createdAt: { gte: sixMonthsAgo }, status: "COMPLETED" },
    });

    if (txns.length === 0) return { score: 50 };

    const totalVolume = txns.reduce((s, t) => s + Number(t.netAmount), 0);
    const months = Math.max(1, 6);
    const avgMonthly = totalVolume / months;
    const threshold = 100;
    const health = Math.min(100, (avgMonthly / threshold) * 100);

    return { score: Math.round(health) };
  }

  private async calculateAccountLongevity(userId: string): Promise<{ score: number }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { score: 0 };

    const days = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const longevity = Math.min(100, (days / 365) * 100);
    return { score: Math.round(longevity) };
  }

  private async calculateKycLevelBonus(userId: string): Promise<{ score: number }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    let level = 0;
    if (user?.metadata && typeof user.metadata === "object" && "kycLevel" in user.metadata) {
      level = Number((user.metadata as { kycLevel?: number }).kycLevel) ?? 0;
    } else if (user?.accountTier) {
      const tierMap: Record<string, number> = { TIER_0: 0, TIER_1: 1, TIER_2: 2, TIER_3: 3 };
      level = tierMap[user.accountTier] ?? 0;
    }
    const bonus = [0, 60, 80, 100][Math.min(level, 3)] ?? 0;
    return { score: bonus };
  }

  private async calculateIncomeStability(userId: string): Promise<{ score: number }> {
    const deposits = await prisma.transaction.findMany({
      where: { userId, transactionType: "DEPOSIT", status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    if (deposits.length < 3) return { score: 50 };
    const amounts = deposits.map((d) => Number(d.netAmount));
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = Math.sqrt(amounts.reduce((s, a) => s + (a - avg) ** 2, 0) / amounts.length);
    const cv = avg > 0 ? variance / avg : 1;
    const stability = Math.max(0, 100 - cv * 50);
    return { score: Math.round(stability) };
  }

  private async calculateCrossProductHolding(userId: string): Promise<{ score: number }> {
    const wallets = await prisma.wallet.count({ where: { userId, isActive: true } });
    const hasLoans = (await prisma.loan.count({ where: { userId, status: "ACTIVE" } })) > 0;
    const score = Math.min(100, wallets * 25 + (hasLoans ? 25 : 0));
    return { score };
  }

  private async calculateReferralNetworkHealth(_userId: string): Promise<{ score: number }> {
    return { score: 50 };
  }

  private applyRiskModifiers(score: number, _components: ScoreComponents): number {
    return score;
  }

  private async saveScore(userId: string, score: number, components: ScoreComponents): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const accountAgeDays = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const riskLevel = score >= 70 ? "LOW" : score >= 50 ? "MEDIUM" : score >= 30 ? "HIGH" : "VERY_HIGH";

    await prisma.creditProfile.upsert({
      where: { userId },
      create: {
        userId,
        financialDisciplineScore: score,
        scoreFactors: components as unknown as object,
        creditLimit: 0,
        availableCredit: 0,
        repaymentReliability: components.repaymentReliability,
        savingsConsistency: components.savingsConsistency,
        transactionHealth: components.transactionHealth,
        accountLongevity: accountAgeDays,
        kycLevelBonus: components.kycLevelBonus,
        riskLevel,
        lastScoreUpdate: new Date(),
      },
      update: {
        previousScore: (await prisma.creditProfile.findUnique({ where: { userId } }))?.financialDisciplineScore ?? undefined,
        financialDisciplineScore: score,
        scoreFactors: components as unknown as object,
        repaymentReliability: components.repaymentReliability,
        savingsConsistency: components.savingsConsistency,
        transactionHealth: components.transactionHealth,
        accountLongevity: accountAgeDays,
        kycLevelBonus: components.kycLevelBonus,
        riskLevel: riskLevel as "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH",
        lastScoreUpdate: new Date(),
      },
    });
  }
}
