/**
 * FinEra - Credit Limit Engine (Dynamic)
 * Tier-based limits with country risk multipliers
 */

import type { AccountType } from "@prisma/client";

export interface CreditLimitParams {
  userId: string;
  accountType: AccountType;
  countryCode: string;
  financialDisciplineScore: number;
  monthlyIncome?: number;
  existingLoansTotal: number;
  walletBalances: Record<string, number>;
  kycLevel: number;
  accountAgeDays: number;
}

const COUNTRY_RISK_MULTIPLIERS: Record<string, number> = {
  USA: 1.2, US: 1.2, CAN: 1.15, CA: 1.15, GBR: 1.1, GB: 1.1, UK: 1.1,
  DEU: 1.1, DE: 1.1, FRA: 1.05, FR: 1.05, ZAF: 0.8, ZA: 0.8,
  NGA: 0.7, NG: 0.7, KEN: 0.7, KE: 0.7, GHA: 0.65, GH: 0.65,
  ZWE: 0.5, ZW: 0.5,
};

const BASE_LIMITS: Record<AccountType, Record<string, { min: number; max: number }>> = {
  STUDENT: {
    TIER_1: { min: 50, max: 200 },
    TIER_2: { min: 200, max: 500 },
    TIER_3: { min: 500, max: 2000 },
  },
  STAFF: {
    TIER_1: { min: 200, max: 1000 },
    TIER_2: { min: 1000, max: 5000 },
    TIER_3: { min: 5000, max: 15000 },
  },
  ALUMNI: {
    TIER_1: { min: 150, max: 800 },
    TIER_2: { min: 800, max: 3000 },
    TIER_3: { min: 3000, max: 10000 },
  },
};

export class CreditLimitEngine {
  calculateCreditLimit(params: CreditLimitParams): number {
    const { accountType, countryCode, financialDisciplineScore, kycLevel, accountAgeDays, existingLoansTotal, walletBalances } = params;

    const tier = this.determineTier(kycLevel, accountAgeDays);
    const baseRange = BASE_LIMITS[accountType][tier];
    const baseLimit = baseRange.min + ((baseRange.max - baseRange.min) * (financialDisciplineScore / 100));

    const countryMultiplier = COUNTRY_RISK_MULTIPLIERS[countryCode.toUpperCase()] ?? 0.5;
    let limit = baseLimit * countryMultiplier;

    if (existingLoansTotal > 0) {
      limit = Math.max(0, limit - existingLoansTotal * 0.3);
    }

    const totalBalance = Object.values(walletBalances).reduce((a, b) => a + b, 0);
    if (totalBalance > 0) {
      const balanceBoost = Math.min(limit * 0.2, totalBalance * 0.5);
      limit += balanceBoost;
    }

    return Math.round(limit);
  }

  private determineTier(kycLevel: number, accountAgeDays: number): "TIER_1" | "TIER_2" | "TIER_3" {
    if (kycLevel >= 3 && accountAgeDays > 180) return "TIER_3";
    if (kycLevel >= 2 && accountAgeDays > 30) return "TIER_2";
    return "TIER_1";
  }
}
