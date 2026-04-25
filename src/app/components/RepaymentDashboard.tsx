import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { FineraGradientBackdrop } from "@/app/components/FineraGradientBackdrop";
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
      <div className="relative isolate flex min-h-dvh flex-col items-center justify-center gap-4 overflow-hidden p-4">
        <FineraGradientBackdrop />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="font-medium text-foreground">Loading {cc} loan…</p>
        </div>
      </div>
    );
  }

  if (walletError) {
    return (
      <div className="relative isolate min-h-dvh overflow-hidden p-4">
        <FineraGradientBackdrop />
        <div className="relative z-10 mx-auto max-w-2xl space-y-6 pt-6">
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
    <div className="relative isolate min-h-dvh overflow-hidden p-4">
      <FineraGradientBackdrop />
      <div className="relative z-10 mx-auto max-w-2xl space-y-6 pt-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div>
          <h1 className="text-3xl font-black text-black dark:text-zinc-100">Repayment Overview</h1>
          <p className="text-sm font-bold text-black/90 dark:text-zinc-300 mt-1">All amounts in {cc}</p>
        </div>

        <Card className="border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-black dark:text-zinc-100">Repayment Progress</span>
              <span className="text-sm font-bold tabular-nums text-black dark:text-zinc-100">
                {repaymentPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={Math.min(repaymentPercentage, 100)} className="h-3" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="mb-1 text-sm font-semibold text-black dark:text-zinc-100">Outstanding ({cc})</p>
              <p className="text-2xl font-black text-black dark:text-zinc-100">
                {formatAmountWithCurrency(outstandingBalance, cc)}
              </p>
              <p className="mt-1 text-xs font-medium text-black dark:text-zinc-200">
                Remaining on this currency loan
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="mb-1 text-sm font-semibold text-black dark:text-zinc-100">Repaid so far</p>
              <p className="text-2xl font-black text-black dark:text-zinc-100">
                {formatAmountWithCurrency(amountRepaid, cc)}
              </p>
              <p className="mt-1 text-xs font-medium text-black dark:text-zinc-200">
                Toward total {formatAmountWithCurrency(totalDue, cc)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-black mb-2">Payment history</h2>
          <p className="text-sm text-muted-foreground mb-4">
            History for your {cc} loan will appear here after repayments post to the ledger.
          </p>
          <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-muted-foreground text-sm">
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
