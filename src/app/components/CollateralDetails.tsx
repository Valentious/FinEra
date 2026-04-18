import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Checkbox } from "@/app/components/ui/checkbox";
import { 
  ArrowLeft, 
  ShieldAlert, 
  Calculator,
  FileCheck
} from "lucide-react";
import { CollateralMultiUpload } from "./CollateralMultiUpload";
import { LoanApplicationFlow } from "@/app/components/LoanApplicationFlow";
import type { LoanType } from "@/loan/loanTypes";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CURRENCY_AMOUNT_SYMBOLS, currencyAmountPlaceholder } from "@/types/wallet";
import { isCheckboxChecked } from "@/lib/checkboxState";
interface CollateralDetailsProps {
  currencyCode: string;
  loanType: LoanType;
  onSubmit: (data: unknown) => void;
  onBack: () => void;
}

const brandShell =
  "relative overflow-hidden border-none bg-gradient-to-br from-primary to-[#1ebe5d] text-white shadow-[0_8px_24px_-8px_rgba(37,211,102,0.35)]";

export function CollateralDetails({
  currencyCode,
  loanType,
  onSubmit,
  onBack,
}: CollateralDetailsProps) {
  const cc = currencyCode.toUpperCase();
  const sym = CURRENCY_AMOUNT_SYMBOLS[cc] ?? cc;
  const inputPadClass = sym.length > 2 ? "pl-24" : "pl-10";
  const [description, setDescription] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [disclosureAccepted, setDisclosureAccepted] = useState(false);
  const [step, setStep] = useState<"disclosure" | "form">("disclosure");
  const [collateralFiles, setCollateralFiles] = useState<string[]>([]);
  const [ownershipBypassMessage, setOwnershipBypassMessage] = useState("");

  const DISCLOSURE_TEXT = "Your approved loan amount is based on: (1) Asset condition assessment, (2) Current market value, and (3) Secure storage verification. The final amount is calculated as a percentage of the liquidation value, not market value. Important: If you default and the asset is liquidated, no refund will be issued for any difference between asset value and loan balance.";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOwnershipBypassMessage("");
    if (!confirmed) {
      setOwnershipBypassMessage("Confirm proof of ownership before generating a loan limit.");
      toast.error("Please confirm proof of ownership.");
      return;
    }

    // Calculation Engine (Internal Logic for display)
    const marketValue = parseFloat(estimatedValue) || 0;
    const conditionScore = 0.85; // Mock assessment
    const liquidationValue = marketValue * conditionScore * 0.7; // 70% of adjusted
    const insuranceMandate = Math.max(10, liquidationValue * 0.005);
    
    onSubmit({
      liquidationValue,
      insuranceMandate,
      description,
      marketValue,
      collateral: collateralFiles,
    });
  };

  return (
    <div className="min-h-dvh bg-transparent p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <LoanApplicationFlow loanType={loanType} step="collateral" />
        <AnimatePresence mode="wait">
          {step === "disclosure" && (
            <motion.div
              key="disclosure"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-2xl font-black text-foreground">Mandatory Disclosure</h2>
              </div>

              <Card className={`${brandShell} p-8`}>
                <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-white/20 blur-3xl" />
                <div className="relative z-10 space-y-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/35 bg-white/15 backdrop-blur-md">
                    <ShieldAlert className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight text-white">Legal Agreement & Risk Acknowledgment</h3>
                  <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-6 text-sm font-medium italic leading-relaxed text-zinc-700 backdrop-blur-sm dark:border-white/12 dark:bg-black/30 dark:text-zinc-200">
                    "{DISCLOSURE_TEXT}"
                  </div>

                  <div className="flex items-start space-x-3 rounded-xl border border-white/45 bg-white/45 p-4 backdrop-blur-sm dark:border-white/15 dark:bg-white/10">
                    <Checkbox
                      id="disclosure-check"
                      checked={disclosureAccepted}
                      onCheckedChange={(checked) => setDisclosureAccepted(isCheckboxChecked(checked))}
                      className="border-zinc-500/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:border-zinc-400/35"
                      aria-describedby={!disclosureAccepted ? "disclosure-continue-hint" : undefined}
                    />
                    <div className="min-w-0 flex-1">
                      <Label htmlFor="disclosure-check" className="cursor-pointer text-xs font-medium text-white">
                        I have read, understood, and accept these collateral-based lending terms.
                      </Label>
                    </div>
                  </div>

                  <Button
                    type="button"
                    disabled={!disclosureAccepted}
                    onClick={() => {
                      if (!disclosureAccepted) return;
                      setStep("form");
                    }}
                    className="h-14 w-full rounded-2xl bg-white font-semibold text-primary shadow-xl transition-all hover:bg-white/90 active:scale-[0.98]"
                  >
                    Agree & Proceed
                  </Button>
                  {!disclosureAccepted ? (
                    <p id="disclosure-continue-hint" className="text-center text-xs font-medium text-white/85" role="status">
                      Check the box above to enable Agree &amp; Proceed.
                    </p>
                  ) : null}
                </div>
              </Card>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setStep("disclosure")} className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-2xl font-black text-foreground">Asset Verification</h2>
              </div>

              <Card className={`${brandShell} p-5`}>
                <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
                <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl border border-white/45 bg-white/45 p-4 backdrop-blur-sm dark:border-white/15 dark:bg-white/10">
                    <div className="rounded-lg border border-white/35 bg-white/15 p-2">
                      <Calculator className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/80">Liquidation Rate</p>
                      <p className="text-sm font-semibold tracking-tight text-white">70% of Assessment</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/45 bg-white/45 p-4 backdrop-blur-sm dark:border-white/15 dark:bg-white/10">
                    <div className="rounded-lg border border-white/35 bg-white/15 p-2">
                      <FileCheck className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/80">Insurance Policy</p>
                      <p className="text-sm font-semibold tracking-tight text-white">0.5% Coverage Req.</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-slate-100 shadow-xl shadow-slate-200/50 rounded-3xl bg-white">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-muted-foreground ml-1">Asset Market Value ({cc})</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground text-sm max-w-[5rem] leading-tight">
                        {sym}
                      </span>
                      <Input
                        type="number"
                        placeholder={currencyAmountPlaceholder(cc)}
                        value={estimatedValue}
                        onChange={(e) => setEstimatedValue(e.target.value)}
                        className={`h-14 ${inputPadClass} text-xl font-black rounded-2xl border-slate-200`}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-muted-foreground ml-1">Asset Description & Condition</Label>
                    <Textarea
                      placeholder="e.g. MacBook Pro M2, 16GB RAM, No scratches, Original packaging included."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="rounded-2xl border-slate-200 focus:ring-emerald-600 resize-none"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-muted-foreground">Upload Asset Evidence (Front, Back, Serial)</Label>
                    <CollateralMultiUpload files={collateralFiles} onChange={setCollateralFiles} />
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <Checkbox
                      id="ownership"
                      checked={confirmed}
                      onCheckedChange={(checked) => {
                        setOwnershipBypassMessage("");
                        setConfirmed(isCheckboxChecked(checked));
                      }}
                      className="mt-1"
                      aria-invalid={ownershipBypassMessage ? true : undefined}
                      aria-describedby={ownershipBypassMessage ? "ownership-error" : undefined}
                    />
                    <div className="flex-1">
                      <Label htmlFor="ownership" className="text-xs font-black text-foreground cursor-pointer">
                        Proof of Ownership Confirmation
                      </Label>
                      <p className="text-[10px] text-muted-foreground font-medium mt-1 leading-relaxed">
                        I legally own this asset and authorize its assessment for secure storage verification. I understand it will be held as collateral.
                      </p>
                      {ownershipBypassMessage ? (
                        <p id="ownership-error" role="alert" className="mt-2 text-xs font-bold text-red-600">
                          {ownershipBypassMessage}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-lg font-black shadow-xl shadow-emerald-100" disabled={!confirmed}>
                    Generate Loan Limit
                  </Button>
                </form>
              </Card>

              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Secure Asset Gateway v4.0</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
