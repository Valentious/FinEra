import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { 
  ArrowLeft, 
  CreditCard, 
  Globe, 
  UserCircle, 
  Building2, 
  CheckCircle2,
  Info,
  Smartphone,
  Zap,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { AgentGateway } from "./AgentGateway";

interface DepositFlowProps {
  currentBalance: number;
  onConfirm: (amount: number, method: string, purpose: string) => void;
  onBack: () => void;
  onSuccess: () => void;
}

const METHODS = [
  { id: "ecocash", label: "Ecocash", icon: <Smartphone className="w-5 h-5" />, color: "bg-emerald-50 text-emerald-600" },
  { id: "innbucks", label: "Innbucks", icon: <Zap className="w-5 h-5" />, color: "bg-orange-50 text-orange-600" },
  { id: "onemoney", label: "One Money", icon: <Smartphone className="w-5 h-5" />, color: "bg-red-50 text-red-600" },
  { id: "agent", label: "Payment Agent", icon: <UserCircle className="w-5 h-5" />, color: "bg-emerald-50 text-emerald-600" },
  { id: "institution", label: "Official Partner Banks", icon: <Building2 className="w-5 h-5" />, color: "bg-green-50 text-green-600" },
  { id: "mastercard", label: "Mastercard", icon: <CreditCard className="w-5 h-5" />, color: "bg-amber-50 text-amber-600" },
];

const PURPOSES = [
  { id: "savings", label: "Savings" },
  { id: "repayment", label: "Loan Repayment" },
  { id: "investment", label: "Investment Pool" },
  { id: "other", label: "Other" },
];

export function DepositFlow({ currentBalance, onConfirm, onBack, onSuccess }: DepositFlowProps) {
  const [step, setStep] = useState<"details" | "agent" | "processing" | "success">("details");
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleDeposit = () => {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    if (!method) {
      toast.error("Select a deposit method");
      return;
    }

    if (!purpose) {
      toast.error("Select purpose of deposit");
      return;
    }

    if (method === 'agent') {
      setStep("agent");
    } else {
      setLoading(true);
      setStep("processing");
      // Simulate payment gateway
      setTimeout(() => {
        onConfirm(numAmount, method, purpose);
        setLoading(false);
        setStep("success");
      }, 2000);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-500">
      <AnimatePresence mode="wait">
        {step === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-2xl font-black text-slate-900">Add Savings / Deposit</h2>
            </div>

            <div className="space-y-6">
              {/* Amount Input */}
              <div className="space-y-2">
                <Label className="font-bold text-slate-600 ml-1">Deposit Amount</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                  <Input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00" 
                    className="h-14 pl-10 text-xl font-black rounded-2xl border-slate-200"
                  />
                </div>
              </div>

              {/* Method Selection */}
              <div className="space-y-3">
                <Label className="font-bold text-slate-600 ml-1">Select Deposit Method</Label>
                <div className="grid grid-cols-1 gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                        method === m.id ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${m.color}`}>
                          {m.icon}
                        </div>
                        <span className="font-bold text-slate-700">{m.label}</span>
                      </div>
                      {method === m.id && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Purpose Selection */}
              <div className="space-y-3">
                <Label className="font-bold text-slate-600 ml-1">Purpose of Deposit</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PURPOSES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPurpose(p.id)}
                      className={`px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                        purpose === p.id ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleDeposit}
                disabled={loading}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-lg font-bold shadow-xl shadow-emerald-200 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Confirm Deposit"}
              </Button>
            </div>
          </motion.div>
        )}

        {step === "agent" && (
          <motion.div
            key="agent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AgentGateway 
              type="deposit" 
              amount={parseFloat(amount)} 
              onSuccess={(txnId) => {
                onConfirm(parseFloat(amount), "agent", purpose);
                setStep("success");
              }}
              onCancel={() => setStep("details")}
            />
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="relative">
              <div className="w-24 h-24 border-4 border-emerald-100 rounded-full" />
              <Loader2 className="w-24 h-24 text-emerald-600 animate-spin absolute top-0 left-0" />
            </div>
            <h3 className="text-2xl font-black mt-8 text-slate-900">Connecting Gateway...</h3>
            <p className="text-slate-500 font-medium mt-2">Securing your payment channel.</p>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 py-10"
          >
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900">Deposit Successful</h2>
              <p className="text-slate-500 font-medium mt-2">Your funds have been added to your wallet.</p>
            </div>

            <Card className="p-6 border-slate-100 shadow-xl shadow-slate-200/50 rounded-3xl bg-slate-50 text-left">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold text-xs uppercase">Amount</span>
                  <span className="text-slate-900 font-black">${parseFloat(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold text-xs uppercase">Purpose</span>
                  <span className="text-slate-900 font-bold">{PURPOSES.find(p => p.id === purpose)?.label}</span>
                </div>
                <div className="h-[1px] bg-slate-200 my-2" />
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold text-xs uppercase">New Balance</span>
                  <span className="text-emerald-600 font-black">${(currentBalance + parseFloat(amount)).toLocaleString()}</span>
                </div>
              </div>
            </Card>

            <Button 
              onClick={onSuccess}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-lg font-bold"
            >
              Back to Dashboard
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
