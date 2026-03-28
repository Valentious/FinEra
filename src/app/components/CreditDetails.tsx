import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { ArrowLeft, AlertTriangle, CheckCircle, Info, Loader2 } from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import {
  CURRENCY_AMOUNT_SYMBOLS,
  currencyAmountPlaceholder,
  formatAmountWithCurrency,
} from "@/types/wallet";

interface CreditDetailsProps {
  currencyCode: string;
  isWalletLoading: boolean;
  walletError: string | null;
  creditLimitLoading: boolean;
  creditLimitError: boolean;
  limitsReady: boolean;
  creditType: string;
  maxAmount: number;
  repaymentCycle: string;
  savingsRequirement: number;
  currentSavings: number;
  onContinue: (amount: number) => void;
  onBack: () => void;
}

export function CreditDetails({
  currencyCode,
  isWalletLoading,
  walletError,
  creditLimitLoading,
  creditLimitError,
  limitsReady,
  creditType,
  maxAmount,
  repaymentCycle,
  savingsRequirement,
  currentSavings,
  onContinue,
  onBack,
}: CreditDetailsProps) {
  const [amount, setAmount] = useState("");
  const cc = currencyCode.toUpperCase();
  const sym = CURRENCY_AMOUNT_SYMBOLS[cc] ?? cc;
  const inputPadClass = sym.length > 2 ? "pl-24" : "pl-10";

  const requestedAmount = parseFloat(amount) || 0;
  const requiredSavings = requestedAmount * 0.2;
  const maxAllowedLoan = currentSavings / 0.2;

  const savingsCheckApplies = creditType === "essential" || creditType === "business";

  const savingsMet = !savingsCheckApplies || currentSavings >= requiredSavings;
  const amountExceedsLimit = savingsCheckApplies && requestedAmount > maxAllowedLoan;
  const canProceed =
    limitsReady &&
    requestedAmount > 0 &&
    requestedAmount <= maxAmount &&
    savingsMet &&
    !amountExceedsLimit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canProceed) {
      onContinue(requestedAmount);
    }
  };

  if (isWalletLoading || creditLimitLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
        <p className="text-slate-600 font-medium">Loading {cc} credit limits…</p>
      </div>
    );
  }

  if (walletError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 pb-24">
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 pb-24">
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6 pt-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div>
          <h1 className="text-3xl font-black text-slate-900">Credit Details ({cc})</h1>
          <p className="text-slate-500 font-medium mt-1">Loan amounts and limits are in {cc} only</p>
        </div>

        <Card className="p-6 border-slate-200">
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-slate-600 font-medium">Credit Type</span>
              <span className="font-black capitalize">{creditType}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-slate-600 font-medium">Maximum Eligible Amount</span>
              <span className="font-black">{formatAmountWithCurrency(maxAmount, cc)}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-slate-600 font-medium">Repayment Cycle</span>
              <span className="font-black">{repaymentCycle}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-slate-600 font-medium">Savings Requirement</span>
              <span className="font-black">{savingsCheckApplies ? "20% of loan" : "Not required"}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-slate-600 font-medium">Your Current Savings ({cc})</span>
              <span className="font-black text-green-600">{formatAmountWithCurrency(currentSavings, cc)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount" className="font-bold">
                Requested Loan Amount ({cc})
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm max-w-[5rem] leading-tight">
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
                  max={maxAmount}
                  required
                />
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Maximum allowed: {formatAmountWithCurrency(maxAmount, cc)}
                {savingsCheckApplies &&
                  ` (Based on your savings: ${formatAmountWithCurrency(Math.min(maxAllowedLoan, maxAmount), cc)})`}
              </p>
            </div>

            {requestedAmount > 0 && savingsCheckApplies && (
              <div className="space-y-4">
                <Card
                  className={`p-4 ${savingsMet && !amountExceedsLimit ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${savingsMet && !amountExceedsLimit ? "bg-green-100" : "bg-red-100"}`}
                    >
                      {savingsMet && !amountExceedsLimit ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 mb-2">
                        {savingsMet && !amountExceedsLimit ? "Savings Check Passed ✓" : "Savings Requirement Check"}
                      </h4>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600 font-medium">Requested Amount:</span>
                            <span className="font-black">{formatAmountWithCurrency(requestedAmount, cc)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600 font-medium">Required Savings (20%):</span>
                            <span className="font-black text-emerald-600">
                              {formatAmountWithCurrency(requiredSavings, cc)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600 font-medium">Your Current Savings:</span>
                            <span
                              className={`font-black ${currentSavings >= requiredSavings ? "text-green-600" : "text-red-600"}`}
                            >
                              {formatAmountWithCurrency(currentSavings, cc)}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                            <span>Savings Progress</span>
                            <span>{Math.min((currentSavings / requiredSavings) * 100, 100).toFixed(0)}%</span>
                          </div>
                          <Progress
                            value={Math.min((currentSavings / requiredSavings) * 100, 100)}
                            className="h-2"
                          />
                        </div>

                        {amountExceedsLimit && (
                          <div className="flex items-start gap-2 p-3 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm text-red-800 font-bold">
                                Your selected loan amount exceeds allowed limit based on your current savings.
                              </p>
                              <p className="text-xs text-red-700 mt-1">
                                Maximum loan you can request: {formatAmountWithCurrency(maxAllowedLoan, cc)}
                              </p>
                            </div>
                          </div>
                        )}

                        {!savingsMet && !amountExceedsLimit && (
                          <div className="flex items-start gap-2 p-3 bg-amber-100 rounded-lg">
                            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800 font-bold">
                              You need {formatAmountWithCurrency(requiredSavings - currentSavings, cc)} more in savings
                              to qualify for this loan amount.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-3 bg-emerald-50 border-emerald-200">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-emerald-900 font-bold">
                        Financial Discipline Rule: 20% minimum savings required ({cc})
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {requestedAmount > 0 && !savingsCheckApplies && (
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-green-800 font-bold">No minimum savings requirement for Emergency Credit</p>
                  </div>
                </div>
              </Card>
            )}

            <Button type="submit" className="w-full h-14 text-lg font-black rounded-xl" size="lg" disabled={!canProceed}>
              {!canProceed && requestedAmount > 0 ? "Cannot Proceed - Check Requirements" : "Continue to Collateral Selection"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
