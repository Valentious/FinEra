import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Badge } from "@/app/components/ui/badge";
import { 
  ArrowLeft, 
  ShieldAlert, 
  Info, 
  Calculator,
  CheckCircle2,
  FileCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface CollateralDetailsProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
}

export function CollateralDetails({ onSubmit, onBack }: CollateralDetailsProps) {
  const [description, setDescription] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [disclosureAccepted, setDisclosureAccepted] = useState(false);
  const [step, setStep] = useState<"disclosure" | "form">("disclosure");

  const DISCLOSURE_TEXT = "Your approved loan amount is based on: (1) Asset condition assessment, (2) Current market value, and (3) Secure storage verification. The final amount is calculated as a percentage of the liquidation value, not market value. Important: If you default and the asset is liquidated, no refund will be issued for any difference between asset value and loan balance.";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculation Engine (Internal Logic for display)
    const marketValue = parseFloat(estimatedValue) || 0;
    const conditionScore = 0.85; // Mock assessment
    const liquidationValue = marketValue * conditionScore * 0.7; // 70% of adjusted
    const insuranceMandate = Math.max(10, liquidationValue * 0.005); // 0.5% or min $10
    
    onSubmit({
      liquidationValue,
      insuranceMandate,
      description,
      marketValue
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
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
                <h2 className="text-2xl font-black text-slate-900">Mandatory Disclosure</h2>
              </div>

              <Card className="p-8 border-none bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-3xl rounded-full -mr-16 -mt-16" />
                <div className="relative z-10 space-y-6">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/30">
                    <ShieldAlert className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-black">Legal Agreement & Risk Acknowledgment</h3>
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10 italic text-indigo-100 leading-relaxed font-medium">
                    "{DISCLOSURE_TEXT}"
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-indigo-600/20 rounded-xl border border-indigo-600/30">
                    <Checkbox
                      id="disclosure-check"
                      checked={disclosureAccepted}
                      onCheckedChange={(checked) => setDisclosureAccepted(checked as boolean)}
                      className="border-white/30 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                    />
                    <Label htmlFor="disclosure-check" className="text-xs font-bold cursor-pointer text-indigo-100">
                      I have read, understood, and accept these collateral-based lending terms.
                    </Label>
                  </div>

                  <Button 
                    disabled={!disclosureAccepted}
                    onClick={() => setStep("form")}
                    className="w-full h-14 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl font-black transition-all shadow-xl active:scale-[0.98]"
                  >
                    Agree & Proceed
                  </Button>
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
                <h2 className="text-2xl font-black text-slate-900">Asset Verification</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Liquidation Rate</p>
                    <p className="text-sm font-black text-slate-900">70% of Assessment</p>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg text-green-600">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Insurance Policy</p>
                    <p className="text-sm font-black text-slate-900">0.5% Coverage Req.</p>
                  </div>
                </div>
              </div>

              <Card className="p-6 border-slate-100 shadow-xl shadow-slate-200/50 rounded-3xl bg-white">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-600 ml-1">Asset Market Value (USD)</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={estimatedValue}
                        onChange={(e) => setEstimatedValue(e.target.value)}
                        className="h-14 pl-10 text-xl font-black rounded-2xl border-slate-200"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-slate-600 ml-1">Asset Description & Condition</Label>
                    <Textarea
                      placeholder="e.g. MacBook Pro M2, 16GB RAM, No scratches, Original packaging included."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="rounded-2xl border-slate-200 focus:ring-indigo-600 resize-none"
                      required
                    />
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                    <Label className="font-bold text-slate-600 mb-2 block">Upload Asset Evidence (Front, Back, Serial)</Label>
                    <div className="flex gap-4">
                      <div className="flex-1 h-24 bg-white rounded-xl border-2 border-dashed border-slate-100 flex items-center justify-center cursor-pointer hover:border-indigo-300 transition-all">
                        <span className="text-[10px] font-black text-slate-400">UPLOAD PHOTO</span>
                      </div>
                      <div className="flex-1 h-24 bg-white rounded-xl border-2 border-dashed border-slate-100 flex items-center justify-center cursor-pointer hover:border-indigo-300 transition-all">
                        <span className="text-[10px] font-black text-slate-400">UPLOAD SERIAL</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <Checkbox
                      id="ownership"
                      checked={confirmed}
                      onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                      className="mt-1"
                      required
                    />
                    <div className="flex-1">
                      <Label htmlFor="ownership" className="text-xs font-black text-slate-700 cursor-pointer">
                        Proof of Ownership Confirmation
                      </Label>
                      <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">
                        I legally own this asset and authorize its assessment for secure storage verification. I understand it will be held as collateral.
                      </p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-black shadow-xl shadow-indigo-100" disabled={!confirmed}>
                    Generate Loan Limit
                  </Button>
                </form>
              </Card>

              <div className="flex items-center justify-center gap-2 text-slate-400">
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
