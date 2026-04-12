import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { ArrowLeft, Info } from "lucide-react";
import { formatAmountWithCurrency } from "@/types/wallet";
import {
  getDisciplineScoreGradientClasses,
  onDisciplineGradientMuted,
  onDisciplineGradientOrb,
  onDisciplineGradientShellShadow,
  onDisciplineGradientText,
} from "@/lib/disciplineGradient";
import { finAmountHero, finAmountPrimary } from "@/lib/financialTypography";

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
  /** Matches TrustScore / dashboard FinCash card gradient bands */
  disciplineScore?: number;
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
  disciplineScore = 50,
}: SavingsWalletProps) {
  const cc = currencyCode.toUpperCase();
  const totalFinancialAccess = totalSavings + availableCreditFacility;
  const walletGradient = getDisciplineScoreGradientClasses(disciplineScore);

  return (
    <div className="min-h-dvh bg-transparent p-4">
      <div className="max-w-2xl mx-auto space-y-6 pt-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-black text-foreground">{walletLabel}</h1>

        <Card
          className={`relative overflow-hidden border-none bg-gradient-to-br ${walletGradient} p-8 ${onDisciplineGradientShellShadow} ${onDisciplineGradientText}`}
        >
          <div className={`absolute -right-16 -top-16 h-32 w-32 rounded-full blur-3xl ${onDisciplineGradientOrb}`} />
          <div className="relative z-10">
            <p className={`mb-2 text-sm ${onDisciplineGradientMuted}`}>Total balance ({cc})</p>
            <p className={`mb-6 text-5xl leading-none ${finAmountHero} ${onDisciplineGradientText}`}>
              {formatAmountWithCurrency(totalSavings, cc)}
            </p>
            <p className={`mb-4 text-xs font-medium ${onDisciplineGradientMuted}`}>Your funds in this currency only</p>

            <div className="grid grid-cols-2 gap-4 border-t border-white/35 pt-4 dark:border-white/15">
              <div>
                <p className={`text-sm ${onDisciplineGradientMuted}`}>Locked (credit security)</p>
                <p className={`text-2xl leading-none ${finAmountPrimary} ${onDisciplineGradientText}`}>
                  {formatAmountWithCurrency(lockedSavings, cc)}
                </p>
              </div>
              <div>
                <p className={`text-sm ${onDisciplineGradientMuted}`}>Available to cash out</p>
                <p className={`text-2xl leading-none ${finAmountPrimary} ${onDisciplineGradientText}`}>
                  {formatAmountWithCurrency(availableSavings, cc)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Available Credit Facility (if exists) */}
        {availableCreditFacility > 0 && (
          <Card
            className={`relative overflow-hidden border-none bg-gradient-to-br ${walletGradient} p-6 ${onDisciplineGradientShellShadow} ${onDisciplineGradientText}`}
          >
            <div className={`absolute -right-12 -top-12 h-28 w-28 rounded-full blur-3xl ${onDisciplineGradientOrb}`} />
            <div className="relative z-10">
              <p className={`mb-2 text-sm ${onDisciplineGradientMuted}`}>Available Credit Facility</p>
              <p className={`mb-2 text-4xl leading-none ${finAmountHero} ${onDisciplineGradientText}`}>
                {formatAmountWithCurrency(availableCreditFacility, cc)}
              </p>
              <p className={`text-xs font-medium ${onDisciplineGradientMuted}`}>Approved credit limit (borrowed facility)</p>
            </div>
          </Card>
        )}

        {/* Total Financial Access (Informational) */}
        {availableCreditFacility > 0 && (
          <Card className="p-6 bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-wide mb-1">Total Financial Access</p>
                <p className={`text-3xl leading-none text-foreground ${finAmountHero}`}>
                  {formatAmountWithCurrency(totalFinancialAccess, cc)}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Informational only: wallet + approved credit ({cc})</p>
              </div>
              <Info className="w-8 h-8 text-muted-foreground" />
            </div>
          </Card>
        )}

        {/* Important Note */}
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
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