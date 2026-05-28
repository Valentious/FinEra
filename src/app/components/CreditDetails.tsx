import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { LoanApplicationFlow } from "@/app/components/LoanApplicationFlow";
import type { AppAccountType, LoanType } from "@/loan/loanTypes";
import { requiresCollateralStep } from "@/loan/loanTypes";
import { CreditEvaluationService } from "@/services/creditEvaluation";
import { toast } from "sonner";
import {
  CURRENCY_AMOUNT_SYMBOLS,
  currencyAmountPlaceholder,
  formatAmountWithCurrency,
} from "@/types/wallet";

interface CreditDetailsProps {
  currencyCode: string;
  /** e.g. FinEra USD Wallet - matches active dashboard currency */
  walletLabel: string;
  isWalletLoading: boolean;
  walletError: string | null;
  creditLimitLoading: boolean;
  creditLimitError: boolean;
  limitsReady: boolean;
  loanType: LoanType;
  accountType: AppAccountType;
  maxAmount: number;
  repaymentCycle: string;
  onContinue: (amount: number) => void | Promise<void>;
  onBack: () => void;
}

export function CreditDetails({
  currencyCode,
  walletLabel,
  isWalletLoading,
  walletError,
  creditLimitLoading,
  creditLimitError,
  limitsReady,
  loanType,
  accountType,
  maxAmount,
  repaymentCycle,
  onContinue,
  onBack,
}: CreditDetailsProps) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const cc = currencyCode.toUpperCase();
  const sym = CURRENCY_AMOUNT_SYMBOLS[cc] ?? cc;
  const inputPadClass = sym.length > 2 ? "pl-24" : "pl-10";

  const requestedAmount = parseFloat(amount) || 0;

  const collateralFlow = requiresCollateralStep(loanType);
  const pageBg = collateralFlow ? "min-h-dvh bg-transparent p-4 pb-24" : "min-h-dvh bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 pb-24";

  const showStaffSalaryOverview = accountType === "staff" && loanType === "SALARY_BACKED";
  const isSalaryBasedLoan = loanType === "SALARY_BACKED";
  /** Business (alumni) – asset-based flow uses this overview copy. */
  const overviewValue =
    accountType === "alumni"
      ? "Working capital and capital expenditure requirements"
      : "Personal consumption";

  const canProceed =
    limitsReady &&
    requestedAmount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed || submitting) return;
    setSubmitting(true);
    try {
      const evaluated = await CreditEvaluationService.evaluateForLoanType(loanType, requestedAmount, cc);
      if (!evaluated.ok) {
        toast.error(evaluated.message);
        return;
      }
      await Promise.resolve(onContinue(requestedAmount));
    } finally {
      setSubmitting(false);
    }
  };

  if (isWalletLoading || creditLimitLoading) {
    return (
      <div
        className={`${collateralFlow ? "bg-transparent" : "bg-gradient-to-br from-emerald-50 to-emerald-100"} flex min-h-dvh flex-col items-center justify-center gap-4 p-4`}
      >
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
        <p className="text-muted-foreground font-medium">Loading {cc} credit limits…</p>
      </div>
    );
  }

  if (walletError) {
    return (
      <div className={pageBg}>
        <div className="max-w-2xl mx-auto space-y-6 pt-6">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card className="p-8 border-red-200 bg-red-50">
            <p className="font-black text-red-900 mb-2">Wallet error</p>
            <p className="text-red-800">{walletError}</p>
          </Card>
        </div>
      </div>
    );
  }

  if (creditLimitError || !limitsReady) {
    return (
      <div className={pageBg}>
        <div className="max-w-2xl mx-auto space-y-6 pt-6">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card className="p-8 border-amber-200 bg-amber-50">
            <p className="font-black text-amber-900 mb-2">Could not load eligibility for {cc}</p>
            <p className="text-amber-800 text-sm">Try again or return to the dashboard.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={pageBg}>
      <div className="max-w-2xl mx-auto space-y-6 pt-6">
        <Button variant="ghost" onClick={onBack} disabled={submitting}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <LoanApplicationFlow loanType={loanType} step="amount" />

        <div>
          <h1 className="text-3xl font-black text-foreground">Credit Details ({cc})</h1>
          <p className="text-muted-foreground font-medium mt-1">Loan amounts and limits are in {cc} only</p>
        </div>

        <Card className="p-6 border-slate-200">
          <div className="space-y-4 mb-6">
            {showStaffSalaryOverview ? (
              <div className="space-y-0 pb-3 border-b">
                {(
                  [
                    { label: "Overview", value: "Personal consumption" },
                    { label: "Lending Methodology", value: "Deductions through SSB" },
                    { label: "Tenure", value: "Up to 24 months" },
                    { label: "Collateral requirement", value: "Salary" },
                  ] as const
                ).map((row) => (
                  <div
                    key={row.label}
                    className="flex flex-col gap-0.5 border-t border-slate-100 py-2.5 first:border-t-0 first:pt-0 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                  >
                    <span className="shrink-0 text-muted-foreground font-medium">{row.label}</span>
                    <span className="min-w-0 text-left font-black sm:max-w-[60%] sm:text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 border-b border-slate-200 pb-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <span className="shrink-0 text-muted-foreground font-medium">Overview</span>
                <span className="min-w-0 text-left font-black sm:max-w-[70%] sm:text-right">
                  {overviewValue}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-muted-foreground font-medium">Maximum Eligible Amount</span>
              <span className="font-black">{formatAmountWithCurrency(maxAmount, cc)}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-muted-foreground font-medium">Repayment frequency</span>
              <span className="font-black">{repaymentCycle}</span>
            </div>

            <div className="pb-3 border-b">
              <span className="text-muted-foreground font-medium">Pricing</span>
              <ul className="mt-2 space-y-1.5 text-sm font-bold text-foreground list-disc pl-4">
                <li>1% Establishment fees</li>
                <li>1.2% Insurance fees</li>
                <li>1% Arrangement fees</li>
                <li>2% Funds transfer fees</li>
                <li>10% per month on reducing balance method</li>
              </ul>
            </div>

            {isSalaryBasedLoan && (
              <>
                <div className="flex flex-col gap-0.5 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-muted-foreground font-medium">Grace period</span>
                  <span className="font-black">None</span>
                </div>
                <div className="border-b border-slate-200 pb-3">
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <span className="shrink-0 text-muted-foreground font-medium">Qualifying criteria</span>
                    <p className="m-0 min-w-0 text-left text-sm font-bold leading-snug text-foreground sm:max-w-[72%] sm:text-right sm:text-base">
                      Maximum depends on the current net salary. (Affordability table attached).
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount" className="font-bold">
                Requested Loan Amount ({cc})
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground text-sm max-w-[5rem] leading-tight">
                  {sym}
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder={currencyAmountPlaceholder(cc)}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`${inputPadClass} h-14 text-xl font-black`}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Maximum allowed: {formatAmountWithCurrency(maxAmount, cc)}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-black rounded-xl inline-flex items-center justify-center gap-2"
              size="lg"
              disabled={!canProceed || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                  Evaluating eligibility…
                </>
              ) : !canProceed ? (
                "Enter requested amount"
              ) : requiresCollateralStep(loanType) ? (
                "Continue to Risk Acknowledgment"
              ) : (
                accountType === "alumni"
                  ? "Continue to Collateral Documents"
                  : accountType === "student"
                    ? "Continue to Upload Current Result Slip"
                    : "Continue to document upload"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
