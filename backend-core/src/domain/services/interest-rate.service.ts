/**
 * FinEra - Dynamic Interest Rate Engine
 */

export type SupportedCurrency = "USD" | "ZIG" | "ZAR" | "EUR" | "GBP";

export interface InterestRateParams {
  userId: string;
  currency: SupportedCurrency;
  loanAmount: number;
  loanTermMonths: number;
  financialDisciplineScore: number;
  existingLoansCount: number;
  collateralPresent: boolean;
}

const BASE_RATES: Record<SupportedCurrency, { min: number; max: number }> = {
  USD: { min: 0.05, max: 0.15 },
  EUR: { min: 0.04, max: 0.12 },
  GBP: { min: 0.045, max: 0.13 },
  ZAR: { min: 0.08, max: 0.2 },
  ZIG: { min: 0.15, max: 0.3 },
};

const SCORE_ADJUSTMENTS = [
  { minScore: 80, maxScore: 100, adjustment: -0.02 },
  { minScore: 60, maxScore: 79, adjustment: 0 },
  { minScore: 40, maxScore: 59, adjustment: 0.03 },
  { minScore: 0, maxScore: 39, adjustment: 0.05 },
];

export class InterestRateEngine {
  calculateInterestRate(params: InterestRateParams): number {
    const { currency, loanAmount, loanTermMonths, financialDisciplineScore, collateralPresent } = params;

    const baseRange = BASE_RATES[currency] ?? BASE_RATES.USD;
    let baseRate: number;

    if (loanAmount > 10000) {
      baseRate = baseRange.min + (baseRange.max - baseRange.min) * 0.3;
    } else if (loanAmount > 5000) {
      baseRate = baseRange.min + (baseRange.max - baseRange.min) * 0.5;
    } else {
      baseRate = baseRange.min + (baseRange.max - baseRange.min) * 0.7;
    }

    const adj = SCORE_ADJUSTMENTS.find(
      (a) => financialDisciplineScore >= a.minScore && financialDisciplineScore <= a.maxScore
    )?.adjustment ?? 0;

    let finalRate = baseRate + adj;

    if (collateralPresent) finalRate *= 0.85;
    if (loanTermMonths > 24) finalRate *= 1.1;
    else if (loanTermMonths > 12) finalRate *= 1.05;

    finalRate = Math.min(baseRange.max, Math.max(baseRange.min, finalRate));
    return Math.round(finalRate * 10000) / 100;
  }
}
