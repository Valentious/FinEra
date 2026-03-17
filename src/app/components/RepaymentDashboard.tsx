import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { ArrowLeft } from "lucide-react";

interface RepaymentDashboardProps {
  totalCredit: number;
  amountRepaid: number;
  outstandingBalance: number;
  onMakeRepayment: () => void;
  onBack: () => void;
}

export function RepaymentDashboard({
  totalCredit,
  amountRepaid,
  outstandingBalance,
  onMakeRepayment,
  onBack,
}: RepaymentDashboardProps) {
  const repaymentPercentage = (amountRepaid / totalCredit) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6 pt-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl">Repayment Overview</h1>

        {/* Progress Card */}
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-600">Repayment Progress</span>
              <span className="text-sm font-semibold">{repaymentPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={repaymentPercentage} className="h-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Total Amount Due</p>
              <p className="text-2xl">${totalCredit.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">Includes principal + fees</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Amount Repaid</p>
              <p className="text-2xl text-green-700">${amountRepaid.toLocaleString()}</p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Outstanding Balance</p>
              <p className="text-2xl text-orange-700">${outstandingBalance.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* Payment History */}
        <Card className="p-6">
          <h2 className="text-xl mb-4">Payment History</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-semibold text-sm">Payment #1</p>
                <p className="text-sm text-slate-600">January 15, 2026</p>
              </div>
              <span className="font-semibold text-green-700">$500.00</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-semibold text-sm">Payment #2</p>
                <p className="text-sm text-slate-600">January 22, 2026</p>
              </div>
              <span className="font-semibold text-green-700">$250.00</span>
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <Button onClick={onMakeRepayment} className="w-full" size="lg">
          Make Repayment
        </Button>
      </div>
    </div>
  );
}