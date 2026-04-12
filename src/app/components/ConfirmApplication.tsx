import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import { ArrowLeft, ShieldCheck, ShieldAlert, FileText } from "lucide-react";
import { formatAmountWithCurrency } from "@/types/wallet";
import type { LoanType } from "@/loan/loanTypes";
import { getLoanProductLabel, requiresCollateralStep } from "@/loan/loanTypes";
import { LoanApplicationFlow } from "@/app/components/LoanApplicationFlow";

interface ConfirmApplicationProps {
  currencyCode: string;
  creditType: string;
  amount: number;
  repaymentTerms: string;
  loanType: LoanType;
  onSubmit: () => void;
  onBack: () => void;
}

export function ConfirmApplication({
  currencyCode,
  creditType,
  amount,
  repaymentTerms,
  loanType,
  onSubmit,
  onBack,
}: ConfirmApplicationProps) {
  const cc = currencyCode.toUpperCase();
  const [acknowledged, setAcknowledged] = useState(false);
  const collateralFlow = requiresCollateralStep(loanType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (acknowledged) {
      onSubmit();
    }
  };

  return (
    <div
      className={
        collateralFlow
          ? "min-h-dvh bg-transparent p-4 pb-12"
          : "min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 pb-12"
      }
    >
      <div className="max-w-2xl mx-auto space-y-6 pt-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {collateralFlow && (
          <LoanApplicationFlow loanType={loanType} step="confirm" />
        )}

        <div className="flex items-center gap-3">
          <FileText className={`w-8 h-8 ${collateralFlow ? "text-primary" : "text-emerald-600"}`} />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Loan Terms Agreement</h1>
            <p className="mt-1 text-sm font-bold text-muted-foreground">Currency: {cc}</p>
          </div>
        </div>

        {/* Loan Type Display */}
        <Card
          className={
            collateralFlow ? "overflow-hidden border-none bg-white shadow-2xl dark:bg-slate-950" : "border-2 border-emerald-100 bg-white p-6"
          }
        >
          {collateralFlow ? (
            <div className="relative overflow-hidden bg-gradient-to-br from-primary to-[#1ebe5d] p-6 text-white shadow-[0_8px_24px_-8px_rgba(37,211,102,0.35)]">
              <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
              <div className="relative z-10 flex items-start gap-4">
                <div className="rounded-xl border border-white/35 bg-white/15 p-3 backdrop-blur-sm">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-white">{getLoanProductLabel(loanType)}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-white/80">
                    {loanType === "SALARY_BACKED"
                      ? "Linked to verified payroll and automated repayment capacity."
                      : "Loan backed by verified assets and valuation."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4 p-6 pb-0">
              <div
                className={`rounded-xl p-3 ${
                  requiresCollateralStep(loanType) ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
                }`}
              >
                {requiresCollateralStep(loanType) ? (
                  <ShieldCheck className="h-6 w-6" />
                ) : (
                  <ShieldAlert className="h-6 w-6" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">{getLoanProductLabel(loanType)}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {loanType === "SALARY_BACKED"
                    ? "Linked to verified payroll and automated repayment capacity."
                    : requiresCollateralStep(loanType)
                      ? "Loan backed by verified assets and valuation."
                      : "Loan approved using internal credit scoring without pledged collateral."}
                </p>
              </div>
            </div>
          )}

          <div
            className={`space-y-4 p-4 ${collateralFlow ? "rounded-none border-t border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80" : "mb-8 rounded-lg bg-slate-50"}`}
          >
            <h3 className="font-semibold text-foreground border-b pb-2">Mandatory Agreements</h3>
            <ul className="space-y-3">
              {loanType === "SALARY_BACKED" ? (
                <>
                  <li className="flex gap-2 text-sm text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    I authorize payroll-linked verification for repayment capacity and ongoing eligibility.
                  </li>
                  <li className="flex gap-2 text-sm text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    I understand repayments are mandatory and may be prioritized per salary-backed policy.
                  </li>
                </>
              ) : requiresCollateralStep(loanType) ? (
                <>
                  <li className="flex gap-2 text-sm text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    Asset details provided are true and correct to the best of my knowledge.
                  </li>
                  <li className="flex gap-2 text-sm text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    The provided asset may be used to recover the loan if repayment fails according to the terms.
                  </li>
                </>
              ) : (
                <>
                  <li className="flex gap-2 text-sm text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    I understand that repayment is mandatory regardless of the lack of physical collateral.
                  </li>
                  <li className="flex gap-2 text-sm text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    I acknowledge that late payments or defaults will negatively affect my future credit eligibility.
                  </li>
                </>
              )}
            </ul>
          </div>

          <div className={`space-y-4 mb-8 ${collateralFlow ? "px-6" : ""}`}>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Credit Amount ({cc})</span>
              <span className="text-lg font-bold text-foreground">{formatAmountWithCurrency(amount, cc)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Repayment Cycle</span>
              <span className="font-semibold text-foreground">{repaymentTerms}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={`space-y-6 ${collateralFlow ? "px-6 pb-6" : ""}`}>
            <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all ${acknowledged ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
              <Checkbox
                id="acknowledge"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label 
                  htmlFor="acknowledge" 
                  className="text-sm font-bold cursor-pointer block leading-tight"
                >
                  I understand and agree to repay the credit amount according to the specified terms and conditions, including applicable interest and service fees.
                </Label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold shadow-lg shadow-emerald-200" 
              disabled={!acknowledged}
            >
              Submit Loan Application
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
