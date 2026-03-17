import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { 
  ArrowLeft, 
  Info, 
  CreditCard, 
  Wallet, 
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Banknote,
  Smartphone
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface WalletManagementProps {
  approvedCreditWallet: number;
  savingsWallet: number;
  activeCredit: number;
  onTransferToSavings: (amount: number) => void;
  onAddSavings: () => void;
  onWithdraw: () => void;
  onBack: () => void;
}

export function WalletManagement({
  approvedCreditWallet,
  savingsWallet,
  activeCredit,
  onTransferToSavings,
  onAddSavings,
  onWithdraw,
  onBack,
}: WalletManagementProps) {
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Calculate 20% minimum savings requirement for active credit
  const minimumSavingsRequired = activeCredit > 0 ? activeCredit * 0.2 : 0;
  const savingsRequirementMet = savingsWallet >= minimumSavingsRequired;
  const savingsProgressPercentage = minimumSavingsRequired > 0 
    ? Math.min((savingsWallet / minimumSavingsRequired) * 100, 100) 
    : 100;

  const handleTransfer = () => {
    const amount = parseFloat(transferAmount);
    
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > approvedCreditWallet) {
      toast.error("Transfer amount exceeds approved credit wallet balance");
      return;
    }

    // Check if transfer would violate 20% savings requirement
    const newSavingsBalance = savingsWallet + amount;
    if (activeCredit > 0 && newSavingsBalance < minimumSavingsRequired) {
      toast.error(`You must maintain at least $${minimumSavingsRequired.toLocaleString()} in savings (20% of loan amount)`);
      return;
    }

    onTransferToSavings(amount);
    setTransferAmount("");
    setShowTransferModal(false);
    toast.success(`$${amount.toLocaleString()} transferred to Savings Wallet`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6 pt-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div>
          <h1 className="text-3xl font-black text-slate-900">Wallet Management</h1>
          <p className="text-slate-500 font-medium mt-1">
            Manage your credit and savings wallets
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
            <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="px-3 py-1.5 bg-amber-500/90 text-white text-xs font-black rounded-full backdrop-blur-md uppercase tracking-wide flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Non-Withdrawable
                  </div>
                </div>
                
                <p className="text-blue-100 text-xs font-black uppercase tracking-widest mb-1">
                  Approved Credit Wallet
                </p>
                <h3 className="text-5xl font-black mb-4">
                  ${approvedCreditWallet.toLocaleString()}
                </h3>
                
                <div className="space-y-3 pt-4 border-t border-white/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Info className="w-4 h-4 text-blue-200" />
                    <p className="text-blue-100 font-medium">
                      Can only transfer to Savings Wallet
                    </p>
                  </div>
                  
                  {approvedCreditWallet > 0 && (
                    <Button
                      onClick={() => setShowTransferModal(true)}
                      className="w-full bg-white text-blue-600 hover:bg-blue-50 h-12 rounded-xl font-black gap-2 shadow-lg"
                    >
                      Transfer to Savings
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
                    Withdrawable
                  </div>
                </div>
                
                <p className="text-green-100 text-xs font-black uppercase tracking-widest mb-1">
                  Saving Balance Wallet
                </p>
                <h3 className="text-5xl font-black mb-4">
                  ${savingsWallet.toLocaleString()}
                </h3>
                
                <div className="space-y-3 pt-4 border-t border-white/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Info className="w-4 h-4 text-green-200" />
                    <p className="text-green-100 font-medium">
                      Available for withdrawal & deposit
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={onAddSavings}
                      variant="outline"
                      className="bg-white/10 text-white hover:bg-white/20 border-white/30 h-10 rounded-xl font-black backdrop-blur-md"
                    >
                      Deposit
                    </Button>
                    <Button
                      onClick={onWithdraw}
                      disabled={savingsWallet === 0}
                      className="bg-white text-green-600 hover:bg-green-50 h-10 rounded-xl font-black"
                    >
                      Withdraw
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Savings Requirement Progress (if active credit exists) */}
        {activeCredit > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className={`p-6 ${savingsRequirementMet ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${savingsRequirementMet ? 'bg-green-100' : 'bg-red-100'}`}>
                  {savingsRequirementMet ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-slate-900 mb-2">
                    {savingsRequirementMet ? 'Savings Requirement Met ✓' : 'Minimum Savings Requirement'}
                  </h3>
                  <p className="text-sm text-slate-600 font-medium mb-4">
                    You must maintain at least <span className="font-black">${minimumSavingsRequired.toLocaleString()}</span> (20% of your loan amount) in your Savings Wallet.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-black text-slate-600">
                      <span>Current Savings: ${savingsWallet.toLocaleString()}</span>
                      <span>{savingsProgressPercentage.toFixed(0)}% of Required</span>
                    </div>
                    <Progress value={savingsProgressPercentage} className="h-3" />
                    
                    {!savingsRequirementMet && (
                      <p className="text-xs text-red-600 font-bold mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        You need ${(minimumSavingsRequired - savingsWallet).toLocaleString()} more to meet the requirement
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Withdrawal & Deposit Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-4">Withdrawal & Deposit Methods</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Banknote className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h4 className="font-black text-slate-900">ATM Access</h4>
                </div>
                <p className="text-sm text-slate-600 font-medium mb-2">
                  Withdraw or deposit funds at any SFIS-affiliated ATM
                </p>
                <p className="text-xs text-slate-500">
                  Available 24/7 • No fees for first 3 transactions/month
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Smartphone className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="font-black text-slate-900">Mobile Wallet</h4>
                </div>
                <p className="text-sm text-slate-600 font-medium mb-2">
                  Transfer to M-Pesa, Airtel Money, or other mobile wallets
                </p>
                <p className="text-xs text-slate-500">
                  Instant transfer • 1% transaction fee applies
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Important Information */}
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm text-slate-700 font-bold">
                Wallet System Rules
              </p>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>Approved Credit Wallet funds cannot be withdrawn directly</li>
                <li>Transfer from Approved Credit → Savings Wallet to access funds</li>
                <li>For Essential & Business Credit: Maintain 20% minimum savings</li>
                <li>Emergency Credit: No minimum savings requirement</li>
                <li>Withdrawal restrictions apply if savings requirement not met</li>
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
                Transfer to Savings Wallet
              </h3>
              <p className="text-sm text-slate-600 font-medium mb-6">
                Move funds from your Approved Credit Wallet to make them withdrawable
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">
                    Available in Approved Credit Wallet
                  </label>
                  <div className="text-3xl font-black text-blue-600">
                    ${approvedCreditWallet.toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">
                    Transfer Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-14 pl-10 pr-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-2xl font-black"
                      step="0.01"
                      min="0"
                      max={approvedCreditWallet}
                    />
                  </div>
                  <button
                    onClick={() => setTransferAmount(approvedCreditWallet.toString())}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 mt-2"
                  >
                    Transfer maximum amount
                  </button>
                </div>

                {activeCredit > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-800 font-medium flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Remember: You must maintain at least ${minimumSavingsRequired.toLocaleString()} in Savings Wallet
                    </p>
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
                  className="flex-1 h-12 rounded-xl font-black bg-blue-600 hover:bg-blue-700"
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
