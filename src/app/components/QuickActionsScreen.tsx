/**
 * FinEra - Quick Actions Screen
 * Single screen containing all quick action buttons and their procedures.
 */

import { Button } from "@/app/components/ui/button";
import { QuickActionsPanel } from "@/app/components/QuickActionsPanel";

interface QuickActionsScreenProps {
  onAddSavings: () => void;
  onViewRepayment: () => void;
  onWithdrawFunds: () => void;
  onMakePayment?: () => void;
  onPeerTransfer?: () => void;
  onBack?: () => void;
}

export function QuickActionsScreen({
  onAddSavings,
  onViewRepayment,
  onWithdrawFunds,
  onMakePayment,
  onPeerTransfer,
  onBack,
}: QuickActionsScreenProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {onBack ? (
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 rounded-full">
          ←
        </Button>
      ) : null}

      <QuickActionsPanel
        onAddSavings={onAddSavings}
        onViewRepayment={onViewRepayment}
        onWithdrawFunds={onWithdrawFunds}
        onMakePayment={onMakePayment}
        onPeerTransfer={onPeerTransfer}
      />
    </div>
  );
}
