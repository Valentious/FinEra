/**
 * FinEra — global interest pricing (Dynamic Credit Engine).
 */

import type { LoanProductType } from "@prisma/client";
import { globalAnnualInterestRatePercent } from "./dynamic-credit-engine.js";

export type SupportedCurrency = "USD" | "ZIG" | "ZAR" | "EUR" | "GBP";

export interface InterestRateParams {
  userId: string;
  currency: SupportedCurrency;
  loanAmount: number;
  loanTermMonths: number;
  financialDisciplineScore: number;
  existingLoansCount: number;
  loanType: LoanProductType;
}

export class InterestRateEngine {
  calculateInterestRate(params: InterestRateParams): number {
    void params;
    return globalAnnualInterestRatePercent();
  }
}
