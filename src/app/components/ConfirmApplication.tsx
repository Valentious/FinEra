import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import { ArrowLeft, ShieldCheck, ShieldAlert, FileText } from "lucide-react";

interface ConfirmApplicationProps {
  creditType: string;
  amount: number;
  repaymentTerms: string;
  withCollateral: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

export function ConfirmApplication({
  creditType,
  amount,
  repaymentTerms,
  withCollateral,
  onSubmit,
  onBack,
}: ConfirmApplicationProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (acknowledged) {
      onSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-12">
      <div className="max-w-2xl mx-auto space-y-6 pt-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold">Loan Terms Agreement</h1>
        </div>

        {/* Loan Type Display */}
        <Card className="p-6 border-2 border-indigo-100 bg-white">
          <div className="flex items-start gap-4 mb-6">
            <div className={`p-3 rounded-xl ${withCollateral ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
              {withCollateral ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {withCollateral ? 'Collateral Loan (Secured)' : 'Non-Collateral Loan (Unsecured)'}
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                {withCollateral 
                  ? "Loan backed by an asset provided by the borrower." 
                  : "Loan approved based on eligibility without asset security."}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg space-y-4 mb-8">
            <h3 className="font-semibold text-slate-900 border-b pb-2">Mandatory Agreements</h3>
            <ul className="space-y-3">
              {withCollateral ? (
                <>
                  <li className="flex gap-2 text-sm text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    Asset details provided are true and correct to the best of my knowledge.
                  </li>
                  <li className="flex gap-2 text-sm text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    The provided asset may be used to recover the loan if repayment fails according to the terms.
                  </li>
                </>
              ) : (
                <>
                  <li className="flex gap-2 text-sm text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    I understand that repayment is mandatory regardless of the lack of physical collateral.
                  </li>
                  <li className="flex gap-2 text-sm text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    I acknowledge that late payments or defaults will negatively affect my future credit eligibility.
                  </li>
                </>
              )}
            </ul>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Credit Amount</span>
              <span className="font-bold text-lg">${amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Repayment Cycle</span>
              <span className="font-semibold">{repaymentTerms}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all ${acknowledged ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}>
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
              className="w-full h-14 text-lg font-bold shadow-lg shadow-indigo-200" 
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
