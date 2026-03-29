import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { ArrowLeft, Info } from "lucide-react";
import { formatAmountWithCurrency } from "@/types/wallet";

interface SavingsWalletProps {
  currencyCode: string;
  walletLabel: string;
  totalSavings: number;
  lockedSavings: number;
  availableSavings: number;
  onAddSavings: () => void;
  onWithdraw: () => void;
  onBack: () => void;
  availableCreditFacility?: number; // Optional credit facility amount
}

export function SavingsWallet({
  currencyCode,
  walletLabel,
  totalSavings,
  lockedSavings,
  availableSavings,
  onAddSavings,
  onWithdraw,
  onBack,
  availableCreditFacility = 0,
}: SavingsWalletProps) {
  const cc = currencyCode.toUpperCase();
  const totalFinancialAccess = totalSavings + availableCreditFacility;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6 pt-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl">{walletLabel}</h1>

        <Card className="p-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <p className="text-sm opacity-90 mb-2">Total balance ({cc})</p>
          <p className="text-5xl mb-6">{formatAmountWithCurrency(totalSavings, cc)}</p>
          <p className="text-xs opacity-70 mb-4 font-medium">Your funds in this currency only</p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-sm opacity-90">Locked (credit security)</p>
              <p className="text-2xl">{formatAmountWithCurrency(lockedSavings, cc)}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Available to cash out</p>
              <p className="text-2xl">{formatAmountWithCurrency(availableSavings, cc)}</p>
            </div>
          </div>
        </Card>

        {/* Available Credit Facility (if exists) */}
        {availableCreditFacility > 0 && (
          <Card className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <p className="text-sm opacity-90 mb-2">Available Credit Facility</p>
            <p className="text-4xl mb-2">{formatAmountWithCurrency(availableCreditFacility, cc)}</p>
            <p className="text-xs opacity-70 font-medium">Approved credit limit (borrowed facility)</p>
          </Card>
        )}

        {/* Total Financial Access (Informational) */}
        {availableCreditFacility > 0 && (
          <Card className="p-6 bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wide mb-1">Total Financial Access</p>
                <p className="text-3xl font-black text-slate-900">{formatAmountWithCurrency(totalFinancialAccess, cc)}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">Informational only: wallet + approved credit ({cc})</p>
              </div>
              <Info className="w-8 h-8 text-slate-400" />
            </div>
          </Card>
        )}

        {/* Important Note */}
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700">
              A minimum wallet balance may be required to unlock credit access. Locked amounts serve as security for active credit.
            </p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button size="lg" onClick={onAddSavings} className="h-14">
            Cash In to wallet
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={onWithdraw} 
            className="h-14"
            disabled={availableSavings === 0}
          >
            Cash Out Available Funds
          </Button>
        </div>
      </div>
    </div>
  );
}