import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Building2, User, Hash, MapPin, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";

export interface BankLinkingData {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  branch?: string;
}

interface BankLinkingProps {
  accountHolderName: string;
  onComplete: (data: BankLinkingData) => void;
}

const BANKS = [
  "CBZ Bank",
  "Stanbic Bank",
  "Standard Chartered",
  "Nedbank",
  "FBC Bank",
  "Steward Bank",
  "ZB Bank",
  "EcoCash",
  "OneMoney",
  "Other",
];

export function BankLinking({ accountHolderName, onComplete }: BankLinkingProps) {
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState(accountHolderName);
  const [accountNumber, setAccountNumber] = useState("");
  const [branch, setBranch] = useState("");

  const handleSubmit = () => {
    if (!bankName.trim()) {
      toast.error("Please select your bank");
      return;
    }
    if (!accountHolder.trim()) {
      toast.error("Account holder name is required");
      return;
    }
    if (!accountNumber.trim()) {
      toast.error("Account number is required");
      return;
    }
    if (accountNumber.length < 8) {
      toast.error("Account number must be at least 8 characters");
      return;
    }

    onComplete({
      bankName: bankName.trim(),
      accountHolderName: accountHolder.trim(),
      accountNumber: accountNumber.trim(),
      branch: branch.trim() || undefined,
    });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-transparent p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-foreground">Link Your Bank Account</h2>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Securely connect your bank for seamless transactions
          </p>
        </div>

        <Card className="border-slate-100 shadow-xl shadow-slate-200/50 rounded-3xl p-6">
          <div className="space-y-5">
            {/* Bank Name */}
            <div className="space-y-2">
              <Label className="font-bold text-foreground ml-1 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Bank Name
              </Label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full h-14 rounded-2xl border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-semibold text-base px-4 bg-white"
              >
                <option value="">Select your bank</option>
                {BANKS.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Holder Name */}
            <div className="space-y-2">
              <Label className="font-bold text-foreground ml-1 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                Account Holder Name
              </Label>
              <Input
                placeholder="As it appears on your bank account"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base"
              />
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <Label className="font-bold text-foreground ml-1 flex items-center gap-2">
                <Hash className="w-4 h-4 text-emerald-600" />
                Account Number
              </Label>
              <Input
                placeholder="Enter your bank account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base"
                maxLength={20}
              />
            </div>

            {/* Branch (Optional) */}
            <div className="space-y-2">
              <Label className="font-bold text-foreground ml-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Branch <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                placeholder="e.g., Main Branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base"
              />
            </div>

            {/* Security Notice */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex gap-3">
              <Lock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                  <strong className="font-black">Secure Linking:</strong> Your bank details are encrypted and stored securely. This is a simulated linking process-no real API integration is active.
                </p>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 mt-6 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              Securely Link Account
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
