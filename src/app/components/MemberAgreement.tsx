import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { 
  ShieldAlert, 
  GraduationCap, 
  UserCircle, 
  ArrowRight,
  AlertCircle,
  FileText,
  Banknote
} from "lucide-react";
import { motion } from "framer-motion";

interface MemberAgreementProps {
  memberType: 'student' | 'staff' | 'alumni';
  onAgree: () => void;
  onBack: () => void;
}

export function MemberAgreement({ memberType, onAgree, onBack }: MemberAgreementProps) {
  const [agreed, setAgreed] = useState(false);

  const getAgreementContent = () => {
    switch (memberType) {
      case 'student':
        return {
          title: "Student Portal Agreement",
          icon: <GraduationCap className="w-8 h-8 text-emerald-600" />,
          terms: [
            "Loan default or late repayment may result in temporary restriction from viewing academic results.",
            "Default may lead to temporary restriction from next semester registration access.",
            "Repayment compliance is monitored by the Dean of Students office.",
          ]
        };
      case 'staff':
      case 'alumni':
        return {
          title: memberType === 'staff' ? "Staff Agreement" : "Alumni Agreement",
          icon: <UserCircle className="w-8 h-8 text-emerald-600" />,
          terms: [
            "In case of default, repayments may be automatically deducted from your linked salary/bank account.",
            "You must maintain a verified bank account for repayment tracking and recovery.",
            "Loan activity may be reported to credit bureaus.",
          ]
        };
    }
  };

  const content = getAgreementContent();

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
        <div className="bg-emerald-600 p-8 text-white relative">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black mb-2">Member Agreement</h1>
            <p className="text-emerald-100 font-medium">Please review the terms specific to your {memberType} account.</p>
          </div>
          <FileText className="absolute bottom-[-20px] right-[-20px] w-48 h-48 text-emerald-500 opacity-20 rotate-12" />
        </div>

        <CardContent className="p-8 space-y-8">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              {content.icon}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{content.title}</h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Mandatory Verification</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Key Conditions</p>
            {content.terms.map((term, i) => (
              <div key={i} className="flex gap-4 items-start group">
                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-emerald-100 transition-colors">
                  <span className="text-xs font-black text-emerald-600">{i + 1}</span>
                </div>
                <p className="text-slate-600 text-sm font-medium leading-relaxed">{term}</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-[11px] text-amber-800 font-medium">
              By proceeding, you acknowledge that failure to comply with repayment schedules will trigger the administrative actions listed above.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-50 space-y-6">
            <div className="flex items-center gap-3">
              <Checkbox 
                id="agree-terms" 
                checked={agreed} 
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
                className="w-6 h-6 rounded-lg border-2 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <label 
                htmlFor="agree-terms" 
                className="text-sm font-bold text-slate-700 cursor-pointer"
              >
                I understand and agree to the {content.title}
              </label>
            </div>

            <div className="flex gap-4">
              <Button 
                variant="ghost" 
                onClick={onBack}
                className="flex-1 h-14 rounded-2xl font-bold text-slate-500"
              >
                Cancel
              </Button>
              <Button 
                onClick={onAgree}
                disabled={!agreed}
                className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-lg font-bold shadow-xl shadow-emerald-200 disabled:opacity-50"
              >
                Agree & Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
