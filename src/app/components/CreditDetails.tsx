import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { ArrowLeft, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Progress } from "@/app/components/ui/progress";

interface CreditDetailsProps {
  creditType: string;
  maxAmount: number;
  repaymentCycle: string;
  savingsRequirement: number;
  currentSavings: number; // Add current savings to validate
  onContinue: (amount: number) => void;
  onBack: () => void;
}

export function CreditDetails({
  creditType,
  maxAmount,
  repaymentCycle,
  savingsRequirement,
  currentSavings,
  onContinue,
  onBack,
}: CreditDetailsProps) {
  const [amount, setAmount] = useState("");

  // Calculate 20% dynamic savings requirement
  const requestedAmount = parseFloat(amount) || 0;
  const requiredSavings = requestedAmount * 0.2;
  const maxAllowedLoan = currentSavings / 0.2; // 80% rule: loan cannot exceed 5x savings (savings must be 20%)
  
  // Determine if savings requirement applies (not for emergency credit)
  const savingsCheckApplies = creditType === 'essential' || creditType === 'business';
  
  // Check if current request meets requirements
  const savingsMet = !savingsCheckApplies || currentSavings >= requiredSavings;
  const amountExceedsLimit = savingsCheckApplies && requestedAmount > maxAllowedLoan;
  const canProceed = requestedAmount > 0 && requestedAmount <= maxAmount && savingsMet && !amountExceedsLimit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canProceed) {
      onContinue(requestedAmount);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6 pt-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div>
          <h1 className="text-3xl font-black text-slate-900">Credit Details</h1>
          <p className="text-slate-500 font-medium mt-1">
            Configure your loan amount and review requirements
          </p>
        </div>

        <Card className="p-6 border-slate-200">
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-slate-600 font-medium">Credit Type</span>
              <span className="font-black capitalize">{creditType}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-slate-600 font-medium">Maximum Eligible Amount</span>
              <span className="font-black">${maxAmount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-slate-600 font-medium">Repayment Cycle</span>
              <span className="font-black">{repaymentCycle}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-slate-600 font-medium">Savings Requirement</span>
              <span className="font-black">{savingsCheckApplies ? '20% of loan' : 'Not required'}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-slate-600 font-medium">Your Current Savings</span>
              <span className="font-black text-green-600">${currentSavings.toLocaleString()}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount" className="font-bold">Requested Loan Amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10 h-14 text-xl font-black"
                  step="0.01"
                  min="0"
                  max={maxAmount}
                  required
                />
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Maximum allowed: ${maxAmount.toLocaleString()}
                {savingsCheckApplies && ` (Based on your savings: $${Math.min(maxAllowedLoan, maxAmount).toLocaleString()})`}
              </p>
            </div>

            {/* Dynamic Savings Requirement & Validation */}
            {requestedAmount > 0 && savingsCheckApplies && (
              <div className="space-y-4">
                {/* Savings Requirement Card */}
                <Card className={`p-4 ${savingsMet && !amountExceedsLimit ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${savingsMet && !amountExceedsLimit ? 'bg-green-100' : 'bg-red-100'}`}>
                      {savingsMet && !amountExceedsLimit ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 mb-2">
                        {savingsMet && !amountExceedsLimit ? 'Savings Check Passed ✓' : 'Savings Requirement Check'}
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600 font-medium">Requested Amount:</span>
                            <span className="font-black">${requestedAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600 font-medium">Required Savings (20%):</span>
                            <span className="font-black text-emerald-600">${requiredSavings.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600 font-medium">Your Current Savings:</span>
                            <span className={`font-black ${currentSavings >= requiredSavings ? 'text-green-600' : 'text-red-600'}`}>
                              ${currentSavings.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
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

                        {/* Warning Messages */}
                        {amountExceedsLimit && (
                          <div className="flex items-start gap-2 p-3 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm text-red-800 font-bold">
                                Your selected loan amount exceeds allowed limit based on your current savings.
                              </p>
                              <p className="text-xs text-red-700 mt-1">
                                Maximum loan you can request: ${maxAllowedLoan.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}

                        {!savingsMet && !amountExceedsLimit && (
                          <div className="flex items-start gap-2 p-3 bg-amber-100 rounded-lg">
                            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800 font-bold">
                              You need ${(requiredSavings - currentSavings).toLocaleString()} more in savings to qualify for this loan amount.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 20% Minimum Savings Tooltip */}
                <Card className="p-3 bg-emerald-50 border-emerald-200">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-emerald-900 font-bold">
                        Financial Discipline Rule: 20% minimum savings required
                      </p>
                      <p className="text-xs text-emerald-700 mt-1">
                        This ensures responsible borrowing and demonstrates your commitment to financial stability.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* No savings check for emergency credit */}
            {requestedAmount > 0 && !savingsCheckApplies && (
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-green-800 font-bold">
                      No minimum savings requirement for Emergency Credit
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Emergency credit is designed for urgent situations and doesn't require savings validation.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-black rounded-xl" 
              size="lg"
              disabled={!canProceed}
            >
              {!canProceed && requestedAmount > 0 
                ? 'Cannot Proceed - Check Requirements' 
                : 'Continue to Collateral Selection'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}