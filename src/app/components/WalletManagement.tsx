import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { 
  ArrowLeft, 
  Info, 
  CreditCard, 
  Wallet, 
  ArrowRight,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { formatAmountWithCurrency } from "@/types/wallet";

const APPROVED_CREDIT_TRANSFER_FEE = 0.015;

interface WalletManagementProps {
  currencyCode: string;
  walletLabel: string;
  approvedCreditWallet: number;
  walletBalance: number;
  onTransferToSavings: (amount: number) => void;
  onAddSavings: () => void;
  onWithdraw: () => void;
  onBack: () => void;
}

export function WalletManagement({
  currencyCode,
  walletLabel,
  approvedCreditWallet,
  walletBalance,
  onTransferToSavings,
  onAddSavings,
  onWithdraw,
  onBack,
}: WalletManagementProps) {
  const cc = currencyCode.toUpperCase();
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [showTransferModal, setShowTransferModal] = useState(false);

  const handleTransfer = () => {
    const gross = parseFloat(transferAmount);

    if (!gross || gross <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (gross > approvedCreditWallet) {
      toast.error("Transfer amount exceeds approved credit wallet balance");
      return;
    }

    const fee = Math.round(gross * APPROVED_CREDIT_TRANSFER_FEE * 100) / 100;
    const netToWallet = Math.round((gross - fee) * 100) / 100;

    onTransferToSavings(gross);
    setTransferAmount("");
    setShowTransferModal(false);
    toast.success(
      `${formatAmountWithCurrency(netToWallet, cc)} credited to ${walletLabel} (${formatAmountWithCurrency(fee, cc)} commission)`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6 pt-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div>
          <h1 className="text-3xl font-black text-slate-900">Wallet Management</h1>
          <p className="text-slate-500 font-medium mt-1">
            Manage approved credit and {walletLabel} ({cc})
          </p>
        </div>

        {/* Two-Wallet System */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Approved Credit Wallet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-none shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-3 py-1.5 bg-amber-500/90 text-white text-xs font-black rounded-full backdrop-blur-md uppercase tracking-wide flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    No direct cash out
                  </div>
                </div>
                
                <p className="text-emerald-100 text-xs font-black uppercase tracking-widest mb-1">
                  Approved Credit Wallet
                </p>
                <h3 className="text-5xl font-black mb-4">
                  {formatAmountWithCurrency(approvedCreditWallet, cc)}
                </h3>
                
                <div className="space-y-3 pt-4 border-t border-white/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Info className="w-4 h-4 text-emerald-200" />
                    <p className="text-emerald-100 font-medium">
                      Can only transfer to {walletLabel}
                    </p>
                  </div>
                  
                  {approvedCreditWallet > 0 && (
                    <Button
                      onClick={() => setShowTransferModal(true)}
                      className="w-full bg-white text-emerald-600 hover:bg-emerald-50 h-12 rounded-xl font-black gap-2 shadow-lg"
                    >
                      Transfer to wallet
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Saving Balance Wallet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-green-600 to-emerald-700 text-white border-none shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-3 py-1.5 bg-green-900/40 text-white text-xs font-black rounded-full backdrop-blur-md uppercase tracking-wide flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Cash out ready
                  </div>
                </div>
                
                <p className="text-green-100 text-xs font-black uppercase tracking-widest mb-1">
                  {walletLabel}
                </p>
                <h3 className="text-5xl font-black mb-4">
                  {formatAmountWithCurrency(walletBalance, cc)}
                </h3>
                
                <div className="space-y-3 pt-4 border-t border-white/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Info className="w-4 h-4 text-green-200" />
                    <p className="text-green-100 font-medium">
                      Available for cash out & cash in
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={onAddSavings}
                      variant="outline"
                      className="bg-white/10 text-white hover:bg-white/20 border-white/30 h-10 rounded-xl font-black backdrop-blur-md"
                    >
                      Cash In
                    </Button>
                    <Button
                      onClick={onWithdraw}
                      disabled={walletBalance === 0}
                      className="bg-white text-green-600 hover:bg-green-50 h-10 rounded-xl font-black"
                    >
                      Cash Out
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Important Information */}
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm text-slate-700 font-bold">
                Wallet System Rules
              </p>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>Approved Credit Wallet funds cannot be cashed out directly</li>
                <li>Transfer from Approved Credit → {walletLabel} to access funds</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Transfer Modal */}
      <AnimatePresence>
        {showTransferModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowTransferModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-black text-slate-900 mb-2">
                Transfer to {walletLabel}
              </h3>
              <p className="text-sm text-slate-600 font-medium mb-6">
                Move funds from your Approved Credit Wallet into your FinCash wallet (USD, ZiG, ZAR, etc.). A 1.5% commission applies on each transfer.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">
                    Available in Approved Credit Wallet
                  </label>
                  <div className="text-3xl font-black text-emerald-600">
                    {formatAmountWithCurrency(approvedCreditWallet, cc)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">
                    Transfer Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400 max-w-[4rem] truncate">
                      {cc === "USD" ? "$" : cc === "ZAR" ? "R" : cc === "ZIG" ? "ZiG" : cc}
                    </span>
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-14 pl-16 pr-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/60 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200/80 outline-none text-2xl font-black dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-white"
                      step="0.01"
                      min="0"
                      max={approvedCreditWallet}
                    />
                  </div>
                  <button
                    onClick={() => setTransferAmount(approvedCreditWallet.toString())}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 mt-2"
                  >
                    Transfer maximum amount
                  </button>
                </div>

                {transferAmount && parseFloat(transferAmount) > 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm space-y-1">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Commission (1.5%)</span>
                      <span>
                        {formatAmountWithCurrency(
                          Math.round(parseFloat(transferAmount) * APPROVED_CREDIT_TRANSFER_FEE * 100) / 100,
                          cc
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between font-black text-emerald-700">
                      <span className="uppercase text-xs tracking-wide">You receive in {walletLabel}</span>
                      <span>
                        {formatAmountWithCurrency(
                          Math.round(
                            (parseFloat(transferAmount) -
                              Math.round(parseFloat(transferAmount) * APPROVED_CREDIT_TRANSFER_FEE * 100) / 100) *
                              100
                          ) / 100,
                          cc
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 h-12 rounded-xl font-black"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTransfer}
                  className="flex-1 h-12 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700"
                >
                  Transfer Funds
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
