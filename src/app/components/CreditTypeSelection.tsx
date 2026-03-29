import { useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { 
  ArrowLeft, 
  ShieldCheck, 
  UserCheck, 
  Info,
  CheckCircle2,
  FileText
} from "lucide-react";
import { motion } from "framer-motion";

interface CreditTypeSelectionProps {
  onSelect: (withCollateral: boolean) => void;
  onBack: () => void;
}

export function CreditTypeSelection({ onSelect, onBack }: CreditTypeSelectionProps) {
  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-black text-slate-900">Credit Security Type</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Non-Collateral */}
        <motion.div whileHover={{ y: -5 }}>
          <button 
            onClick={() => onSelect(false)}
            className="w-full text-left h-full flex flex-col p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-emerald-600 hover:shadow-2xl hover:shadow-emerald-50 transition-all group"
          >
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
              <UserCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Non-Collateral</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
              Approved based on your member eligibility without asset security.
            </p>
            <div className="mt-auto space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase">
                <CheckCircle2 className="w-3 h-3" />
                Repayment Mandatory
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase">
                <CheckCircle2 className="w-3 h-3" />
                Credit Score Impact
              </div>
            </div>
          </button>
        </motion.div>

        {/* Collateral Based */}
        <motion.div whileHover={{ y: -5 }}>
          <button 
            onClick={() => onSelect(true)}
            className="w-full text-left h-full flex flex-col p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-emerald-600 hover:shadow-2xl hover:shadow-emerald-50 transition-all group"
          >
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Collateral Based</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
              Secure your loan with physical assets for higher limits.
            </p>
            <div className="mt-auto space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase">
                <CheckCircle2 className="w-3 h-3" />
                Asset Backed
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase">
                <CheckCircle2 className="w-3 h-3" />
                Higher Eligibility
              </div>
            </div>
          </button>
        </motion.div>
      </div>

      <Card className="p-6 bg-slate-900 text-white rounded-3xl border-none shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-2xl">
            <Info className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-black text-lg mb-2">Discipline Policy</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Non-collateral loans require a wallet balance of at least <span className="text-white font-bold">20% of the requested amount</span> in your FinCash currency wallet to demonstrate financial discipline.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
