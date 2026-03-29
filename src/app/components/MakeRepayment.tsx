import { useMemo, useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Wallet,
  Smartphone,
  Building2,
  ShieldCheck,
  Zap,
  UserCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { AgentGateway } from "./AgentGateway";
import {
  CURRENCY_AMOUNT_SYMBOLS,
  currencyAmountPlaceholder,
  formatAmountWithCurrency,
} from "@/types/wallet";

interface MakeRepaymentProps {
  currencyCode: string;
  isWalletLoading?: boolean;
  walletError?: string | null;
  outstandingBalance: number;
  walletBalance: number;
  walletLabel: string;
  onConfirm: (amount: number, method: string) => void | Promise<void>;
  onBack: () => void;
}

export function MakeRepayment({
  currencyCode,
  isWalletLoading,
  walletError,
  outstandingBalance,
  walletBalance,
  walletLabel,
  onConfirm,
  onBack,
}: MakeRepaymentProps) {
  const [step, setStep] = useState<"form" | "agent" | "processing">("form");
  const [amount, setAmount] = useState<string>(outstandingBalance > 0 ? outstandingBalance.toString() : "");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const cc = currencyCode.toUpperCase();
  const sym = CURRENCY_AMOUNT_SYMBOLS[cc] ?? cc;
  const inputPadClass = sym.length > 2 ? "pl-24" : "pl-12";

  const localMethods = useMemo(
    () => [
      { id: "ecocash", label: "Ecocash", icon: <Smartphone className="w-5 h-5" />, color: "bg-emerald-50 text-emerald-600" },
      { id: "innbucks", label: "Innbucks", icon: <Zap className="w-5 h-5" />, color: "bg-orange-50 text-orange-600" },
      { id: "onemoney", label: "One Money", icon: <Smartphone className="w-5 h-5" />, color: "bg-red-50 text-red-600" },
      {
        id: "savings",
        label: `Pay from ${walletLabel}`,
        icon: <Wallet className="w-5 h-5" />,
        color: "bg-green-50 text-green-600",
      },
      { id: "agent", label: "Payment Agent", icon: <UserCircle className="w-5 h-5" />, color: "bg-emerald-50 text-emerald-600" },
      { id: "bank", label: "Partner Banks", icon: <Building2 className="w-5 h-5" />, color: "bg-slate-50 text-slate-600" },
    ],
    [walletLabel]
  );

  const handleRepay = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (selectedMethod === "savings" && walletBalance < numAmount) {
      toast.error(`Insufficient balance in ${walletLabel} for this repayment.`);
      return;
    }

    if (numAmount > outstandingBalance) {
      toast.error("Repayment amount cannot exceed outstanding balance.");
      return;
    }

    if (selectedMethod === "agent") {
      setStep("agent");
    } else {
      setShowConfirmation(true);
    }
  };

  const confirmProcess = async () => {
    setIsProcessing(true);
    try {
      await Promise.resolve(onConfirm(parseFloat(amount), selectedMethod));
    } finally {
      setIsProcessing(false);
    }
  };

  if (isWalletLoading) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-slate-600 font-medium">Loading {cc} balances…</p>
      </div>
    );
  }

  if (walletError) {
    return (
      <div className="max-w-xl mx-auto space-y-6 p-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Card className="p-8 border-red-200 bg-red-50">
          <p className="font-black text-red-900 mb-2">Cannot repay in {cc}</p>
          <p className="text-red-800">{walletError}</p>
        </Card>
      </div>
    );
  }

  if (outstandingBalance <= 0) {
    return (
      <div className="max-w-xl mx-auto space-y-6 p-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Card className="p-8">
          <p className="font-black text-slate-900">Nothing outstanding in {cc}</p>
          <p className="text-slate-600 mt-2">There is no active loan balance for this currency.</p>
          <Button className="mt-6" onClick={onBack}>
            Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-500">
      <AnimatePresence mode="wait">
        {step === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Make Repayment</h2>
                <p className="text-sm font-bold text-slate-500">{cc} only — no cross-currency settlement</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 border-slate-100 bg-white shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outstanding ({cc})</p>
                <p className="text-2xl font-black text-red-500">{formatAmountWithCurrency(outstandingBalance, cc)}</p>
              </Card>
              <Card className="p-4 border-slate-100 bg-white shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                  {walletLabel}
                </p>
                <p className="text-2xl font-black text-green-600">{formatAmountWithCurrency(walletBalance, cc)}</p>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-bold ml-1">Repayment amount ({cc})</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm max-w-[5rem] leading-tight">
                    {sym}
                  </span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={currencyAmountPlaceholder(cc)}
                    className={`h-14 ${inputPadClass} text-xl font-black rounded-2xl border-slate-200`}
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setAmount((outstandingBalance * 0.5).toString())}
                    className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black hover:bg-slate-200 transition-colors"
                  >
                    50% PARTIAL
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(outstandingBalance.toString())}
                    className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black hover:bg-emerald-100 transition-colors"
                  >
                    FULL SETTLEMENT
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-bold ml-1">Select payment method</Label>
                <div className="grid grid-cols-2 gap-3">
                  {localMethods.map((method) => {
                    const isSavings = method.id === "savings";
                    const isSavingsDisabled = isSavings && walletBalance <= 0;

                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedMethod(method.id)}
                        disabled={isSavingsDisabled}
                        className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                          isSavingsDisabled
                            ? "opacity-40 grayscale cursor-not-allowed border-slate-50"
                            : selectedMethod === method.id
                              ? "border-emerald-600 bg-emerald-50/50"
                              : "border-slate-100 bg-white hover:border-slate-200"
                        }`}
                      >
                        <div className={`p-3 rounded-xl mb-3 ${method.color}`}>{method.icon}</div>
                        <span className="font-bold text-xs text-slate-700">{method.label}</span>
                        {isSavings && (
                          <span className="text-[8px] font-black text-slate-400 mt-1">
                            {formatAmountWithCurrency(walletBalance, cc)} AVAILABLE
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={handleRepay}
                disabled={!selectedMethod || isProcessing}
                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-lg font-bold shadow-xl transition-all active:scale-[0.98]"
              >
                {isProcessing ? "Processing..." : "Continue to Verify"}
              </Button>
            </div>
          </motion.div>
        )}

        {step === "agent" && (
          <motion.div key="agent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AgentGateway
              type="repayment"
              amount={parseFloat(amount)}
              onSuccess={() => {
                onConfirm(parseFloat(amount), "agent");
              }}
              onCancel={() => setStep("form")}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmation && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Confirm payment</h3>
              <p className="text-slate-500 text-sm mt-2 mb-8">
                You are about to repay{" "}
                <span className="font-black text-slate-900">{formatAmountWithCurrency(parseFloat(amount) || 0, cc)}</span>{" "}
                ({cc}) using{" "}
                <span className="font-bold text-emerald-600">
                  {localMethods.find((m) => m.id === selectedMethod)?.label ?? selectedMethod}
                </span>
                .
              </p>

              <div className="space-y-3">
                <Button
                  onClick={confirmProcess}
                  disabled={isProcessing}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  {isProcessing ? "Verifying..." : "Confirm & Pay"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowConfirmation(false)}
                  className="w-full h-12 rounded-xl text-slate-500 font-bold"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
