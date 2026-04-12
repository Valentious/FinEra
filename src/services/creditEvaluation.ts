import type { LoanType } from "@/loan/loanTypes";

/**
 * Client-side eligibility / scoring step before advancing past loan amount.
 * Replace with API calls when backend exposes dedicated evaluate endpoints.
 */
export class CreditEvaluationService {
  static async evaluateForLoanType(
    loanType: LoanType,
    amount: number,
    _currency: string
  ): Promise<{ ok: true } | { ok: false; message: string }> {
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, message: "Enter a valid loan amount." };
    }
    // Simulate network + scoring work (asset valuation, payroll pull, or bureau-style score)
    await new Promise((r) => setTimeout(r, loanType === "SALARY_BACKED" ? 900 : 650));
    return { ok: true };
  }
}
