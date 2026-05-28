/**
 * FinEra - Make Payment (Country-specific)
 * Dynamic payment options based on user's country
 */

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { ArrowLeft, Smartphone, Zap, Droplets, GraduationCap, Shield, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { getPaymentOptionsByCountry } from "@/data/paymentOptions";
import { formatAmountWithCurrency } from "@/types/wallet";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  airtime: <Smartphone className="w-5 h-5" />,
  electricity: <Zap className="w-5 h-5" />,
  water: <Droplets className="w-5 h-5" />,
  education: <GraduationCap className="w-5 h-5" />,
  insurance: <Shield className="w-5 h-5" />,
  bills: <Wallet className="w-5 h-5" />,
};

interface MakePaymentProps {
  onBack: () => void;
  onSuccess?: (payment: { amount: number; description: string; gatewayId?: string }) => void;
  countryCode?: string;
  /** Active dashboard currency (ISO-style code, e.g. ZIG for ZiG) */
  currencyCode?: string;
  walletBalance?: number;
  walletLabel?: string;
  currencySymbol?: string;
}

export function MakePayment({
  onBack,
  onSuccess,
  countryCode = "zw",
  currencyCode = "USD",
  walletBalance = 0,
  walletLabel = "FINERA Wallet",
  currencySymbol = "$",
}: MakePaymentProps) {
  const options = getPaymentOptionsByCountry(countryCode);
  const [step, setStep] = useState<"category" | "details" | "gateway" | "confirm" | "success">("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedItem(null);
    setStep("details");
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItem(itemId);
    setStep("gateway");
  };

  const handleConfirm = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!selectedGateway) {
      toast.error("Select a payment gateway");
      return;
    }
    if (selectedGateway === "from_savings" && numAmount > walletBalance) {
      toast.error(
        `Insufficient balance in ${walletLabel}. Available: ${formatAmountWithCurrency(walletBalance, currencyCode)}`
      );
      return;
    }
    const description = item ? `${cat?.label || "Payment"}: ${item.label}` : `Payment - ${recipient || "Bill"}`;
    setLoading(true);
    setStep("confirm");
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep("success");
      toast.success("Payment initiated successfully");
      onSuccess?.({ amount: numAmount, description, gatewayId: selectedGateway });
    }, 2000);
  };

  const cat = options.categories.find((c) => c.id === selectedCategory);
  const item = cat?.items.find((i) => i.id === selectedItem);

  return (
    <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-black text-foreground">Make Payment</h2>
      </div>

      <AnimatePresence mode="wait">
        {step === "category" && (
          <motion.div
            key="category"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <p className="text-muted-foreground font-medium">Select payment type</p>
            <div className="grid grid-cols-1 gap-3">
              {options.categories.map((c) => (
                <Card
                  key={c.id}
                  className="p-4 cursor-pointer hover:border-emerald-500 transition-all"
                  onClick={() => handleSelectCategory(c.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                      {CATEGORY_ICONS[c.id] || <Wallet className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{c.label}</p>
                      <p className="text-xs text-muted-foreground">{c.items.length} option(s)</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {step === "details" && cat && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <Button variant="ghost" size="sm" onClick={() => setStep("category")}>
              ← Back
            </Button>
            <p className="font-bold text-foreground">{cat.label}</p>
            <div className="grid grid-cols-1 gap-2">
              {cat.items.map((i) => (
                <Button
                  key={i.id}
                  variant="outline"
                  className="justify-start h-12 rounded-xl"
                  onClick={() => handleSelectItem(i.id)}
                >
                  {i.label}
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {step === "gateway" && item && (
          <motion.div
            key="gateway"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Button variant="ghost" size="sm" onClick={() => setStep("details")}>
              ← Back
            </Button>
            <div>
              <p className="text-muted-foreground text-sm">{cat?.label}</p>
              <p className="font-black text-foreground">{item.label}</p>
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-14 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Recipient / Account / Meter Number</Label>
              <Input
                placeholder="Enter number"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="h-14 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Gateway</Label>
              {selectedGateway === "from_savings" && (
                <p className="text-sm text-emerald-600 font-medium">
                  Paying from {walletLabel} • Balance: {formatAmountWithCurrency(walletBalance, currencyCode)}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {options.gateways.map((g) => (
                  <Button
                    key={g.id}
                    variant={selectedGateway === g.id ? "default" : "outline"}
                    className="h-12 rounded-xl"
                    onClick={() => setSelectedGateway(g.id)}
                  >
                    {g.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleConfirm}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black"
            >
              Proceed to Pay
            </Button>
          </motion.div>
        )}

        {step === "confirm" && loading && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-bold text-foreground">Processing payment...</p>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
              <Wallet className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2">Payment Initiated</h3>
            <p className="text-muted-foreground mb-6">You will receive a confirmation shortly.</p>
            <Button onClick={onBack} className="w-full h-14 rounded-2xl font-black">
              Back to Dashboard
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
