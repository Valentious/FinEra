import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { 
  ArrowLeft, 
  CreditCard, 
  Wallet, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Smartphone,
  Zap,
  UserCircle,
  Banknote,
  Clock,
  Shield,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { AgentGateway } from "./AgentGateway";

interface WithdrawFlowProps {
  balance: number;
  onConfirm: (amount: number, method: string) => void;
  onBack: () => void;
  onSuccess: () => void;
}

const METHODS = [
  { id: "banktransfer", label: "Bank Transfer", icon: <Building2 className="w-5 h-5" />, color: "bg-green-50 text-green-600" },
  { id: "ecocash", label: "Ecocash", icon: <Smartphone className="w-5 h-5" />, color: "bg-green-50 text-green-600" },
  { id: "innbucks", label: "InnBucks", icon: <Smartphone className="w-5 h-5" />, color: "bg-orange-50 text-orange-600" },
  { id: "onemoney", label: "OneMoney", icon: <Smartphone className="w-5 h-5" />, color: "bg-red-50 text-red-600" },
  { id: "mobilemoney", label: "Mobile Money", icon: <Smartphone className="w-5 h-5" />, color: "bg-emerald-50 text-emerald-600" },
  { id: "cryptowallet", label: "Crypto Wallet", icon: <Wallet className="w-5 h-5" />, color: "bg-purple-50 text-purple-600" },
  { id: "agent", label: "Verified Agent", icon: <UserCircle className="w-5 h-5" />, color: "bg-emerald-50 text-emerald-600" },
  { id: "atm", label: "ATM Cardless Withdrawal", icon: <Banknote className="w-5 h-5" />, color: "bg-amber-50 text-amber-600", featured: true },
];

export function WithdrawFlow({ balance, onConfirm, onBack, onSuccess }: WithdrawFlowProps) {
  const [step, setStep] = useState<"method" | "amount" | "recipient" | "confirmCode" | "agent" | "atm-code" | "processing" | "success">("method");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [recipientDetails, setRecipientDetails] = useState<string>("");
  const [confirmCode, setConfirmCode] = useState<string>("");
  const [sentCode, setSentCode] = useState<string>("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [atmCode, setAtmCode] = useState("");
  const [atmReference, setAtmReference] = useState("");
  const [atmExpiry, setAtmExpiry] = useState<Date | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [refCopied, setRefCopied] = useState(false);

  const MOBILE_METHODS = ["ecocash", "onemoney", "innbucks", "mobilemoney"];
  const needsConfirmCode = MOBILE_METHODS.includes(selectedMethod);

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setStep("amount");
  };

  const handleWithdraw = () => {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (numAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    if (selectedMethod === 'agent') {
      setStep("agent");
    } else if (selectedMethod === 'atm') {
      generateATMCode();
    } else if (needsConfirmCode) {
      setStep("recipient");
    } else {
      setStep("processing");
      setTimeout(() => {
        onConfirm(numAmount, selectedMethod);
        setStep("success");
      }, 2000);
    }
  };

  const handleRecipientSubmit = () => {
    if (!recipientDetails.trim()) {
      toast.error("Enter recipient phone or account details");
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);
    toast.success("Confirmation code sent to your device");
    setStep("confirmCode");
  };

  const handleConfirmCodeSubmit = () => {
    if (confirmCode !== sentCode) {
      toast.error("Invalid confirmation code");
      return;
    }
    setStep("processing");
    setTimeout(() => {
      onConfirm(parseFloat(amount), selectedMethod);
      setStep("success");
    }, 1500);
  };

  const generateATMCode = () => {
    // Simulate OTP verification
    toast.success("OTP sent to your registered mobile number");
    
    setTimeout(() => {
      // Generate 6-digit secure code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setAtmCode(code);
      
      // Generate transaction reference
      const ref = `ATM${Date.now().toString().slice(-8)}`;
      setAtmReference(ref);
      
      // Set 30-minute expiry
      const expiry = new Date(Date.now() + 30 * 60 * 1000);
      setAtmExpiry(expiry);
      
      setStep("atm-code");
      toast.success("ATM withdrawal code generated successfully");
    }, 1500);
  };

  const copyToClipboard = (text: string, type: 'code' | 'ref') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } else {
      setRefCopied(true);
      setTimeout(() => setRefCopied(false), 2000);
    }
    toast.success("Copied to clipboard");
  };

  const completeATMWithdrawal = () => {
    onConfirm(parseFloat(amount), "atm");
    setStep("success");
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-500">
      <AnimatePresence mode="wait">
        {step === "method" && (
          <motion.div
            key="method"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-2xl font-black text-slate-900">Withdraw Funds</h2>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Balance</p>
                <p className="text-2xl font-black text-slate-900">${balance.toLocaleString()}</p>
              </div>
              <Wallet className="w-8 h-8 text-emerald-100" />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-500">Select Withdrawal Method</p>
              {METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method.id)}
                  className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-600 hover:shadow-lg hover:shadow-emerald-50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${method.color}`}>
                      {method.icon}
                    </div>
                    <span className="font-bold text-slate-700 group-hover:text-emerald-600">{method.label}</span>
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 border-slate-100 group-hover:border-emerald-600 group-hover:bg-emerald-600 flex items-center justify-center transition-all">
                    <div className="w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === "amount" && (
          <motion.div
            key="amount"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setStep("method")} className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-2xl font-black text-slate-900">Enter Amount</h2>
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-emerald-600 rounded-3xl text-white">
                <p className="text-emerald-100 text-sm font-medium">To: {METHODS.find(m => m.id === selectedMethod)?.label}</p>
                <div className="relative mt-4">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl font-black text-emerald-200">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent border-none text-white text-5xl font-black focus:ring-0 placeholder:text-emerald-300 pl-8"
                    autoFocus
                  />
                </div>
                <div className="mt-6 flex justify-between items-center pt-6 border-t border-white/10">
                  <p className="text-xs font-bold text-emerald-200">AVAILABLE: ${balance.toLocaleString()}</p>
                  <button onClick={() => setAmount(balance.toString())} className="text-xs font-black bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full">MAX</button>
                </div>
              </div>

              <Button 
                onClick={handleWithdraw}
                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-lg font-bold"
              >
                Confirm Withdrawal
              </Button>
            </div>
          </motion.div>
        )}

        {step === "recipient" && (
          <motion.div
            key="recipient"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Button variant="ghost" size="icon" onClick={() => setStep("amount")} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-black text-slate-900">Recipient Details</h2>
            <p className="text-slate-600 text-sm">
              Enter the phone number or account to receive the withdrawal via {METHODS.find(m => m.id === selectedMethod)?.label}
            </p>
            <div className="space-y-2">
              <Label>Phone / Account Number</Label>
              <Input
                placeholder="+263 77 123 4567"
                value={recipientDetails}
                onChange={(e) => setRecipientDetails(e.target.value)}
                className="h-14 rounded-2xl"
              />
            </div>
            <Button onClick={handleRecipientSubmit} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black">
              Send Confirmation Code
            </Button>
          </motion.div>
        )}

        {step === "confirmCode" && (
          <motion.div
            key="confirmCode"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Button variant="ghost" size="icon" onClick={() => setStep("recipient")} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
              <p className="text-sm font-bold text-amber-900">
                Enter the confirmation code sent to your device to complete withdrawal.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Confirmation Code</Label>
              <Input
                placeholder="Enter 6-digit code"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-14 rounded-2xl text-center text-2xl font-black tracking-[0.5em]"
                maxLength={6}
              />
            </div>
            <Button
              onClick={handleConfirmCodeSubmit}
              disabled={confirmCode.length !== 6}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black disabled:opacity-50"
            >
              Complete Withdrawal
            </Button>
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
              type="withdrawal" 
              amount={parseFloat(amount)} 
              onSuccess={(txnId) => {
                onConfirm(parseFloat(amount), "agent");
                setStep("success");
              }}
              onCancel={() => setStep("amount")}
            />
          </motion.div>
        )}

        {step === "atm-code" && (
          <motion.div
            key="atm-code"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setStep("amount")} className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-2xl font-black text-slate-900">ATM Withdrawal Code</h2>
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-emerald-600 rounded-3xl text-white">
                <p className="text-emerald-100 text-sm font-medium">To: {METHODS.find(m => m.id === selectedMethod)?.label}</p>
                <div className="relative mt-4">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl font-black text-emerald-200">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent border-none text-white text-5xl font-black focus:ring-0 placeholder:text-emerald-300 pl-8"
                    autoFocus
                  />
                </div>
                <div className="mt-6 flex justify-between items-center pt-6 border-t border-white/10">
                  <p className="text-xs font-bold text-emerald-200">AVAILABLE: ${balance.toLocaleString()}</p>
                  <button onClick={() => setAmount(balance.toString())} className="text-xs font-black bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full">MAX</button>
                </div>
              </div>

              <div className="p-6 bg-white rounded-3xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-amber-600" />
                    <p className="text-sm font-bold text-slate-500">ATM Withdrawal Code</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Copy className="w-5 h-5 text-slate-500 cursor-pointer" onClick={() => copyToClipboard(atmCode, 'code')} />
                    {codeCopied && <Check className="w-5 h-5 text-green-600" />}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-black text-slate-900">{atmCode}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-500" />
                    <p className="text-sm font-bold text-slate-500">Expires in: {atmExpiry ? `${Math.ceil((atmExpiry.getTime() - Date.now()) / 60000)} mins` : 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-slate-500" />
                    <p className="text-sm font-bold text-slate-500">Secure Code</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-slate-500">Transaction Reference</p>
                    <button onClick={() => copyToClipboard(atmReference, 'ref')} className="flex items-center gap-1">
                      {refCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    </button>
                  </div>
                  <p className="text-lg font-black text-slate-900">{atmReference}</p>
                </div>
              </div>

              <Button 
                onClick={completeATMWithdrawal}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-lg font-bold"
              >
                Complete Withdrawal
              </Button>
            </div>
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
            <h3 className="text-2xl font-black mt-8 text-slate-900">Processing...</h3>
            <p className="text-slate-500 font-medium mt-2">Moving your funds securely.</p>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8"
          >
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900">Withdrawal Successful</h2>
              <p className="text-slate-500 font-medium mt-2">Your money is on its way!</p>
            </div>

            <Card className="p-6 border-slate-100 shadow-xl shadow-slate-200/50 rounded-3xl bg-slate-50 text-left">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold text-xs uppercase">Amount</span>
                  <span className="text-slate-900 font-black">${parseFloat(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold text-xs uppercase">Method</span>
                  <span className="text-slate-900 font-bold">{METHODS.find(m => m.id === selectedMethod)?.label}</span>
                </div>
                <div className="h-[1px] bg-slate-200 my-2" />
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold text-xs uppercase">Updated Balance</span>
                  <span className="text-emerald-600 font-black">${(balance - parseFloat(amount)).toLocaleString()}</span>
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