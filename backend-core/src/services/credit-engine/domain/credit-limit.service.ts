/**
 * FinEra — credit limit from Trust Score tier only (Dynamic Credit Engine).
 */

import type { AccountType } from "@prisma/client";
import { creditLimitForTrustScore } from "./dynamic-credit-engine.js";

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

export class CreditLimitEngine {
  calculateCreditLimit(params: CreditLimitParams): number {
    void params.countryCode;
    void params.monthlyIncome;
    void params.existingLoansTotal;
    void params.walletBalances;
    void params.kycLevel;
    void params.accountAgeDays;
    void params.userId;
    return creditLimitForTrustScore(params.financialDisciplineScore, params.accountType);
  }
}
