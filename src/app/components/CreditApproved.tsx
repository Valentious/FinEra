import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { CheckCircle2, Calendar } from "lucide-react";
import { formatAmountWithCurrency, getWalletLabel } from "@/types/wallet";

interface CreditApprovedProps {
  currencyCode: string;
  approvedAmount: number;
  repaymentSchedule: string;
  onViewWallet: () => void;
}

export function CreditApproved({ currencyCode, approvedAmount, repaymentSchedule, onViewWallet }: CreditApprovedProps) {
  const cc = currencyCode.toUpperCase();
  const walletLabel = getWalletLabel(cc);
  // Calculate fee breakdown
  const principal = approvedAmount;
  const commission = principal * 0.02;
  const interest = principal * 0.18;
  const totalCost = principal + commission + interest;
  const fmt = (n: number) => formatAmountWithCurrency(n, cc);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
      <Card className="max-w-lg w-full p-8">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="w-20 h-20 text-green-500" />
        </div>
        
        <h1 className="text-3xl text-center mb-2">Credit Approved!</h1>
        <p className="text-center text-muted-foreground mb-8 font-medium">
          Your credit ({cc}) has been added to your Approved Credit Wallet for this currency
        </p>
        
        <div className="space-y-6 mb-8">
          <div className="p-6 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-muted-foreground mb-2 font-medium">Approved Principal Amount ({cc})</p>
            <p className="text-4xl text-green-700 font-black">{fmt(principal)}</p>
            <p className="text-xs text-green-700 mt-2 font-bold">
              ✓ Now available in your Approved Credit Wallet
            </p>
          </div>

          {/* Fee Breakdown */}
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 space-y-3">
            <p className="font-semibold text-sm text-foreground">Loan Cost Breakdown</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Principal</span>
                <span className="font-semibold">{fmt(principal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Commission (2%)</span>
                <span className="font-semibold">{fmt(commission)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Interest (18%)</span>
                <span className="font-semibold">{fmt(interest)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-emerald-300">
                <span className="font-semibold text-foreground">Active Credit Balance</span>
                <span className="font-bold text-emerald-700">{fmt(totalCost)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Loan balance includes principal + 2% commission + 18% interest.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-semibold text-sm mb-1">Repayment Schedule</p>
                <p className="text-sm text-muted-foreground">{repaymentSchedule}</p>
              </div>
            </div>
          </div>

          {/* New Instruction Card */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm font-bold text-amber-900 mb-2">📋 Next Steps</p>
            <ol className="list-decimal list-inside text-sm text-amber-800 space-y-1">
              <li>View your Approved Credit Wallet</li>
              <li>Transfer funds from Approved Credit → {walletLabel}</li>
              <li>Once in {walletLabel}, funds are withdrawable per your currency rules</li>
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