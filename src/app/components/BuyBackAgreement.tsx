import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { 
  ArrowLeft, 
  FileText, 
  AlertCircle, 
  Calendar,
  DollarSign,
  Info
} from "lucide-react";
import { motion } from "motion/react";

interface BuyBackAgreementProps {
  approvedAmount: number;
  onAcceptAndActivate: (repaymentOption: 'single' | 'biweekly') => void;
  onBack: () => void;
}

export function BuyBackAgreement({
  approvedAmount,
  onAcceptAndActivate,
  onBack,
}: BuyBackAgreementProps) {
  const [repaymentOption, setRepaymentOption] = useState<'single' | 'biweekly'>('single');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Calculate financial breakdown
  const principal = approvedAmount;
  const interestRate = 0.18; // 18% per 4 weeks
  const serviceFeeRate = 0.015; // 1.5%
  
  const interest = principal * interestRate;
  const serviceFee = principal * serviceFeeRate;
  const totalBuyBackAmount = principal + interest + serviceFee;

  // Calculate installments for bi-weekly option
  const installment1 = totalBuyBackAmount / 2;
  const installment2 = totalBuyBackAmount / 2;

  // Calculate due dates
  const today = new Date();
  const singlePaymentDueDate = new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000); // 4 weeks
  const installment1DueDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks
  const installment2DueDate = new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000); // 4 weeks

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleAccept = () => {
    if (!agreedToTerms) {
      return;
    }
    onAcceptAndActivate(repaymentOption);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 pb-24">
      <div className="max-w-3xl mx-auto space-y-6 pt-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
            <FileText className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black text-foreground">Digital Asset Sale & Buy-Back Agreement</h1>
          <p className="text-muted-foreground font-medium mt-2 max-w-2xl mx-auto">
            Required before final credit activation
          </p>
        </div>

        {/* Explanation Card */}
        <Card className="p-6 bg-emerald-50 border-emerald-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-foreground font-bold mb-2">How This Works</p>
              <p className="text-foreground text-sm font-medium">
                You are selling your pledged asset to SFIS at the approved credit amount. You agree to repurchase the asset by repaying the total amount below within the selected repayment period.
              </p>
            </div>
          </div>
        </Card>

        {/* Financial Breakdown */}
        <Card className="p-6 border-slate-200">
          <h3 className="text-lg font-black text-foreground mb-4">Financial Breakdown</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Approved Credit (Asset Sale Value)</p>
                  <p className="text-xs text-muted-foreground">Principal amount</p>
                </div>
              </div>
              <p className="text-2xl font-black text-green-700">USD ${principal.toLocaleString()}</p>
            </div>

            <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground font-medium">Interest (18% per 4 weeks):</span>
                <span className="font-black text-foreground">USD ${interest.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground font-medium">Service Fee (1.5%):</span>
                <span className="font-black text-foreground">USD ${serviceFee.toFixed(2)}</span>
              </div>
              
              <div className="h-px bg-slate-200 my-2" />
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-black text-foreground">Total Buy-Back Amount:</span>
                <span className="text-3xl font-black text-emerald-600">USD ${totalBuyBackAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Repayment Options */}
        <Card className="p-6 border-slate-200">
          <h3 className="text-lg font-black text-foreground mb-4">Repayment Options</h3>
          
          <RadioGroup value={repaymentOption} onValueChange={(value: 'single' | 'biweekly') => setRepaymentOption(value)}>
            <div className="space-y-3">
              {/* Single Payment Option */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`flex items-start space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  repaymentOption === 'single' 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                onClick={() => setRepaymentOption('single')}
              >
                <RadioGroupItem value="single" id="single" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="single" className="font-black text-foreground cursor-pointer flex items-center gap-2">
                    4 Weeks (Single Payment)
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase">Recommended</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">
                    Pay the full amount in one installment
                  </p>
                  <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-bold text-muted-foreground uppercase">Due Date</span>
                    </div>
                    <p className="text-lg font-black text-foreground">
                      {formatDate(singlePaymentDueDate)} <span className="text-sm font-medium text-muted-foreground">(28 days)</span>
                    </p>
                    <p className="text-sm font-black text-emerald-600 mt-1">
                      Amount: USD ${totalBuyBackAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Bi-Weekly Option */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`flex items-start space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  repaymentOption === 'biweekly' 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                onClick={() => setRepaymentOption('biweekly')}
              >
                <RadioGroupItem value="biweekly" id="biweekly" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="biweekly" className="font-black text-foreground cursor-pointer">
                    Bi-Weekly (2 Equal Installments)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">
                    Split payment into two equal parts
                  </p>
                  
                  {repaymentOption === 'biweekly' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 space-y-2"
                    >
                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-bold text-muted-foreground uppercase">Installment 1</span>
                        </div>
                        <p className="text-base font-black text-foreground">
                          {formatDate(installment1DueDate)} <span className="text-sm font-medium text-muted-foreground">(Day 14)</span>
                        </p>
                        <p className="text-sm font-black text-emerald-600 mt-1">
                          Amount: USD ${installment1.toFixed(2)}
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-bold text-muted-foreground uppercase">Installment 2</span>
                        </div>
                        <p className="text-base font-black text-foreground">
                          {formatDate(installment2DueDate)} <span className="text-sm font-medium text-muted-foreground">(Day 28)</span>
                        </p>
                        <p className="text-sm font-black text-emerald-600 mt-1">
                          Amount: USD ${installment2.toFixed(2)}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </RadioGroup>

          {/* Grace Period Info */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 font-bold">
                Grace Period: 7 days per installment for flexible repayment scheduling.
              </p>
            </div>
          </div>
        </Card>

        {/* Agreement Checkbox */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="terms" 
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label 
                htmlFor="terms" 
                className="font-black text-foreground cursor-pointer leading-relaxed"
              >
                I understand this is a sale with a buy-back obligation.
              </Label>
              <p className="text-sm text-muted-foreground mt-2 font-medium">
                By checking this box, you confirm that you have read and understood the terms of this digital asset sale and buy-back agreement. You commit to repurchasing your asset by repaying the total buy-back amount according to the selected repayment schedule.
              </p>
            </div>
          </div>
        </Card>

        {/* Accept Button */}
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="flex-1 h-14 rounded-xl font-black text-lg"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAccept}
            disabled={!agreedToTerms}
            className="flex-2 h-14 rounded-xl font-black text-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            Accept & Activate Credit
          </Button>
        </div>

        {!agreedToTerms && (
          <p className="text-center text-sm text-red-600 font-bold">
            You must agree to the terms before activating credit
          </p>
        )}
      </div>
    </div>
  );
}
