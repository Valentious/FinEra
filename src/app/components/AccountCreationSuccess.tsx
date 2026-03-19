import { useMemo } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { CheckCircle2, Copy, User, Phone, CreditCard, DollarSign } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { FinEraAccountNumbers } from "@/services/index";

interface AccountCreationSuccessProps {
  fullName: string;
  phoneNumber: string;
  finEraAccountNumbers?: FinEraAccountNumbers;
  onContinue: () => void;
}

function generateFallbackFinEra(): FinEraAccountNumbers {
  const s = () => Math.random().toString(36).slice(2, 10).toUpperCase().padEnd(8, "0").slice(0, 8);
  return { usd: `FE-USD-${s()}`, zig: `FE-ZIG-${s()}`, zar: `FE-ZAR-${s()}` };
}

export function AccountCreationSuccess({
  fullName,
  phoneNumber,
  finEraAccountNumbers,
  onContinue
}: AccountCreationSuccessProps) {
  const accounts = useMemo(() => finEraAccountNumbers ?? generateFallbackFinEra(), [finEraAccountNumbers]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white pt-12 pb-8">
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                <div className="p-6 bg-white/20 backdrop-blur-sm rounded-full">
                  <CheckCircle2 className="w-20 h-20 text-white" />
                </div>
              </motion.div>
              <CardTitle className="text-3xl font-black mb-2">Account Successfully Created</CardTitle>
              <p className="text-green-100 text-lg">Welcome to FinEra INCLUSIVE CREDIT</p>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-50 rounded-2xl p-6 border-2 border-emerald-100">
              <h3 className="text-lg font-black text-slate-900 mb-4 text-center">Your Account Details</h3>
              
              <div className="space-y-4">
                {/* Account Holder Name */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Account Holder</p>
                        <p className="text-base font-black text-slate-900">{fullName}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(fullName, "Name")}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="w-4 h-4 text-slate-400" />
                    </Button>
                  </div>
                </div>

                {/* FinEra Account Numbers (Multi-Currency) */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">FinEra Account Numbers</p>
                  {[
                    { label: "USD Account Number", value: accounts.usd, icon: DollarSign },
                    { label: "ZiG Account Number", value: accounts.zig, icon: CreditCard },
                    { label: "ZAR Account Number", value: accounts.zar, icon: CreditCard },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="bg-white rounded-xl p-4 shadow-sm border-2 border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Icon className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{label}</p>
                            <p className="text-lg font-black text-green-600 tracking-wider">{value}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(value, label)}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="w-4 h-4 text-slate-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Linked Phone Number */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Phone className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Linked Phone</p>
                        <p className="text-base font-black text-slate-900">{phoneNumber}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(phoneNumber, "Phone Number")}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="w-4 h-4 text-slate-400" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Purpose */}
            <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
              <h4 className="text-sm font-black text-amber-900 mb-2">📌 Account Purpose</h4>
              <p className="text-sm text-amber-800 leading-relaxed">
                All currency-specific account numbers displayed enable you to access loans in your preferred currency. 
                These accounts support deposits, withdrawals, loan repayments, and payments within the FinEra Inclusive Credit Platform.
              </p>
            </div>

            {/* Security Notice */}
            <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
              <h4 className="text-sm font-black text-emerald-900 mb-2">🔒 Security Notice</h4>
              <p className="text-sm text-emerald-800 leading-relaxed">
                Keep your account number secure. Never share your password or sensitive account details 
                with anyone. Our team will never ask for your password via email or phone.
              </p>
            </div>

            <Button 
              onClick={onContinue}
              className="w-full h-14 bg-gradient-to-r from-emerald-600 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 text-white rounded-xl font-black text-lg shadow-lg active:scale-[0.98] transition-all"
            >
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
