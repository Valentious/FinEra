import { useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { 
  ArrowLeft, 
  ArrowRight, 
  PiggyBank, 
  Flame, 
  Briefcase,
  AlertCircle,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";

interface ApplyForCreditProps {
  savingsBalance: number;
  hasActiveLoan: boolean;
  onSelectCreditType: (type: 'essential' | 'emergency' | 'business') => void;
  onBack: () => void;
}

const CREDIT_TYPES = [
  {
    id: "essential",
    title: "Essential Credit",
    desc: "For daily needs and campus essentials.",
    icon: <PiggyBank className="w-6 h-6" />,
    color: "emerald",
    rule: "Requires 20% savings discipline"
  },
  {
    id: "emergency",
    title: "Emergency Credit",
    desc: "Immediate funds for urgent situations.",
    icon: <Flame className="w-6 h-6" />,
    color: "red",
    rule: "Savings rule waived with proof"
  },
  {
    id: "business",
    title: "Business Credit",
    desc: "Startup capital for student entrepreneurs.",
    icon: <Briefcase className="w-6 h-6" />,
    color: "purple",
    rule: "Requires 20% savings discipline"
  }
];

export function ApplyForCredit({ savingsBalance, hasActiveLoan, onSelectCreditType, onBack }: ApplyForCreditProps) {
  const isSavingsTooLow = savingsBalance <= 1;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-3xl font-black text-slate-900">Apply for Credit</h2>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Savings Gateway</p>
          <p className={`text-sm font-black ${isSavingsTooLow ? 'text-red-500' : 'text-green-600'}`}>
            ${savingsBalance.toLocaleString()}
          </p>
        </div>
      </div>

      {hasActiveLoan && (
        <Card className="p-6 bg-red-50 border-red-100 border-2 rounded-3xl">
          <div className="flex gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-2xl h-fit">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-red-900 text-lg">Active Credit Block</h4>
              <p className="text-red-700 text-sm font-medium mt-1 leading-relaxed">
                You currently have an active credit balance. Our policy requires full repayment of existing loans before applying for new credit.
              </p>
              <Button variant="link" className="text-red-900 font-black p-0 mt-4 h-auto text-sm">
                View Repayment Dashboard
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!hasActiveLoan && isSavingsTooLow && (
        <Card className="p-6 bg-amber-50 border-amber-100 border-2 rounded-3xl">
          <div className="flex gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl h-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-amber-900 text-lg">Savings Gateway Check</h4>
              <p className="text-amber-700 text-sm font-medium mt-1 leading-relaxed">
                Minimum savings activity ($1+) is required before credit access. Please top up your savings wallet to unlock credit options.
              </p>
              <Button variant="link" className="text-amber-900 font-black p-0 mt-4 h-auto text-sm">
                Add Savings Now
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {CREDIT_TYPES.map((type) => {
          const isDisabled = hasActiveLoan || isSavingsTooLow;
          
          return (
            <motion.div
              key={type.id}
              whileHover={!isDisabled ? { x: 8 } : {}}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <button
                disabled={isDisabled}
                onClick={() => onSelectCreditType(type.id as any)}
                className={`w-full flex items-center justify-between p-6 bg-white border-2 border-slate-100 rounded-3xl transition-all group relative overflow-hidden ${
                  isDisabled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-emerald-600 hover:shadow-xl hover:shadow-emerald-50'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-2xl bg-${type.color}-50 text-${type.color}-600 group-hover:scale-110 transition-transform`}>
                    {type.icon}
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-black text-slate-900">{type.title}</h3>
                    <p className="text-sm text-slate-500 font-medium">{type.desc}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <CheckCircle2 className={`w-3 h-3 text-${type.color}-600`} />
                      <span className={`text-[10px] font-black uppercase text-${type.color}-600`}>{type.rule}</span>
                    </div>
                  </div>
                </div>
                {!isDisabled && <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />}
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
        <h4 className="text-sm font-black text-slate-900 mb-2">Member Policy Note</h4>
        <ul className="space-y-2">
          <li className="flex gap-2 text-xs text-slate-500 font-medium">
            <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5" />
            Only one active loan allowed at a time.
          </li>
          <li className="flex gap-2 text-xs text-slate-500 font-medium">
            <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5" />
            No third-party transactions allowed for repayments.
          </li>
          <li className="flex gap-2 text-xs text-slate-500 font-medium">
            <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5" />
            Staff members must link a verified bank account.
          </li>
        </ul>
      </div>
    </div>
  );
}
