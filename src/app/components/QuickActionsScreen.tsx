/**
 * FinEra - Quick Actions Screen
 * Single screen containing all quick action buttons and their procedures.
 */

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { HandCoins, Plus, ArrowDown, Wallet, Send } from "lucide-react";
import { motion } from "motion/react";
import { useI18n } from "@/app/providers/I18nProvider";

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
  const { t } = useI18n();
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full shrink-0">
            ←
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">{t("quick.title")}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t("quick.subtitle")}</p>
        </div>
      </div>

      <Card className="p-6 border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onAddSavings}
              className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl font-black"
            >
              <Plus className="w-6 h-6" />
              <span>{t("quick.cashIn")}</span>
            </Button>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onWithdrawFunds}
              className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white rounded-2xl shadow-xl font-black"
            >
              <ArrowDown className="w-6 h-6" />
              <span>{t("quick.cashOut")}</span>
            </Button>
          </motion.div>

          {onPeerTransfer && (
            <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={onPeerTransfer}
                className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl font-black"
              >
                <Send className="w-6 h-6" />
                <span>{t("quick.transfer")}</span>
              </Button>
            </motion.div>
          )}

          <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onViewRepayment}
              className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-xl font-black"
            >
              <HandCoins className="w-6 h-6" />
              <span>{t("quick.repayLoan")}</span>
            </Button>
          </motion.div>

          {onMakePayment && (
            <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={onMakePayment}
                className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl shadow-xl font-black"
              >
                <Wallet className="w-6 h-6" />
                <span>{t("quick.makePayment")}</span>
              </Button>
            </motion.div>
          )}
        </div>
      </Card>
    </div>
  );
}
