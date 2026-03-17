import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { CheckCircle2, Calendar } from "lucide-react";

interface CreditApprovedProps {
  approvedAmount: number;
  repaymentSchedule: string;
  onViewWallet: () => void;
}

export function CreditApproved({ approvedAmount, repaymentSchedule, onViewWallet }: CreditApprovedProps) {
  // Calculate fee breakdown
  const principal = approvedAmount;
  const commission = principal * 0.02; // 2%
  const interest = principal * 0.18; // 18%
  const totalCost = principal + commission + interest;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="max-w-lg w-full p-8">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="w-20 h-20 text-green-500" />
        </div>
        
        <h1 className="text-3xl text-center mb-2">Credit Approved!</h1>
        <p className="text-center text-slate-600 mb-8 font-medium">
          Your credit has been added to your Approved Credit Wallet
        </p>
        
        <div className="space-y-6 mb-8">
          <div className="p-6 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-slate-600 mb-2 font-medium">Approved Principal Amount</p>
            <p className="text-4xl text-green-700 font-black">${principal.toFixed(2)}</p>
            <p className="text-xs text-green-700 mt-2 font-bold">
              ✓ Now available in your Approved Credit Wallet
            </p>
          </div>

          {/* Fee Breakdown */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
            <p className="font-semibold text-sm text-slate-700">Loan Cost Breakdown</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Principal</span>
                <span className="font-semibold">${principal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Commission (2%)</span>
                <span className="font-semibold">${commission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Interest (18%)</span>
                <span className="font-semibold">${interest.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-blue-300">
                <span className="font-semibold text-slate-700">Active Credit Balance</span>
                <span className="font-bold text-blue-700">${totalCost.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Loan balance includes principal + 2% commission + 18% interest.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-600 mt-0.5" />
              <div>
                <p className="font-semibold text-sm mb-1">Repayment Schedule</p>
                <p className="text-sm text-slate-600">{repaymentSchedule}</p>
              </div>
            </div>
          </div>

          {/* New Instruction Card */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm font-bold text-amber-900 mb-2">📋 Next Steps</p>
            <ol className="list-decimal list-inside text-sm text-amber-800 space-y-1">
              <li>View your Approved Credit Wallet</li>
              <li>Transfer funds from Approved Credit → Savings Wallet</li>
              <li>Once in Savings Wallet, funds are withdrawable via ATM</li>
            </ol>
          </div>
        </div>

        <Button onClick={onViewWallet} className="w-full h-14 text-lg font-black" size="lg">
          View Wallet & Transfer Funds
        </Button>
      </Card>
    </div>
  );
}