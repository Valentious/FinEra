import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { ArrowLeft, Loader2 } from "lucide-react";
import { formatAmountWithCurrency } from "@/types/wallet";

interface RepaymentDashboardProps {
  currencyCode: string;
  isWalletLoading?: boolean;
  walletError?: string | null;
  /** Total loan obligation in this currency (for progress). */
  totalObligation: number;
  amountRepaid: number;
  /** Remaining balance in this currency */
  outstandingBalance: number;
  onMakeRepayment: () => void;
  onBack: () => void;
}

export function RepaymentDashboard({
  currencyCode,
  isWalletLoading,
  walletError,
  totalObligation,
  amountRepaid,
  outstandingBalance,
  onMakeRepayment,
  onBack,
}: RepaymentDashboardProps) {
  const cc = currencyCode.toUpperCase();
  const totalDue = Math.max(amountRepaid + outstandingBalance, totalObligation);
  const repaymentPercentage = totalDue > 0 ? (amountRepaid / totalDue) * 100 : 0;

  if (isWalletLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-slate-600 font-medium">Loading {cc} loan…</p>
      </div>
    );
  }

  if (walletError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
        <div className="max-w-2xl mx-auto space-y-6 pt-6">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card className="p-8 border-red-200 bg-red-50">
            <p className="font-black text-red-900 mb-2">Cannot view repayment</p>
            <p className="text-red-800">{walletError}</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6 pt-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div>
          <h1 className="text-3xl font-black text-slate-900">Repayment Overview</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">All amounts in {cc}</p>
        </div>

        <Card className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-600">Repayment Progress</span>
              <span className="text-sm font-semibold">{repaymentPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(repaymentPercentage, 100)} className="h-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Outstanding ({cc})</p>
              <p className="text-2xl font-black text-orange-700">{formatAmountWithCurrency(outstandingBalance, cc)}</p>
              <p className="text-xs text-slate-500 mt-1">Remaining on this currency loan</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Repaid so far</p>
              <p className="text-2xl font-black text-green-700">{formatAmountWithCurrency(amountRepaid, cc)}</p>
              <p className="text-xs text-slate-500 mt-1">Toward total {formatAmountWithCurrency(totalDue, cc)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-black mb-2">Payment history</h2>
          <p className="text-sm text-slate-500 mb-4">
            History for your {cc} loan will appear here after repayments post to the ledger.
          </p>
          <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-slate-500 text-sm">
            No payments recorded yet in {cc}.
          </div>
        </Card>

        <Button
          onClick={onMakeRepayment}
          className="w-full"
          size="lg"
          disabled={outstandingBalance <= 0}
        >
          {outstandingBalance <= 0 ? `Nothing due in ${cc}` : `Make Repayment (${cc})`}
        </Button>
      </div>
    </div>
  );
}
