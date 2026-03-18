import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Wallet, CheckCircle } from "lucide-react";

interface WalletCreditedProps {
  amount: number;
  onWithdrawFunds: () => void;
  onViewRepayment: () => void;
}

export function WalletCredited({ amount, onWithdrawFunds, onViewRepayment }: WalletCreditedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 p-4">
      <Card className="max-w-lg w-full p-8">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Wallet className="w-20 h-20 text-emerald-500" />
            <CheckCircle className="w-8 h-8 text-green-500 absolute -bottom-1 -right-1 bg-white rounded-full" />
          </div>
        </div>
        
        <h1 className="text-3xl text-center mb-4">Funds Available</h1>
        
        <p className="text-center text-slate-600 mb-8">
          Your approved credit has been added to your wallet.
        </p>

        <div className="p-6 bg-emerald-50 rounded-lg border border-emerald-200 mb-8 text-center">
          <p className="text-sm text-slate-600 mb-2">Available Balance</p>
          <p className="text-4xl text-emerald-700">${amount.toLocaleString()}</p>
        </div>

        <div className="space-y-3">
          <Button onClick={onWithdrawFunds} className="w-full" size="lg">
            Withdraw Funds
          </Button>
          <Button onClick={onViewRepayment} variant="outline" className="w-full" size="lg">
            View Repayment Plan
          </Button>
        </div>
      </Card>
    </div>
  );
}
