import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { CheckCircle2, PiggyBank, CreditCard, GraduationCap, ArrowRight } from "lucide-react";

interface WelcomeIntroProps {
  onContinue: () => void;
  userName: string;
}

export function WelcomeIntro({ onContinue, userName }: WelcomeIntroProps) {
  const steps = [
    {
      icon: <PiggyBank className="w-6 h-6 text-green-600" />,
      title: "Build your FinCash Wallet",
      description: "Start saving to unlock higher credit limits and better interest rates."
    },
    {
      icon: <CreditCard className="w-6 h-6 text-emerald-600" />,
      title: "Access FinEra INCLUSIVE CREDIT",
      description: "Get student-friendly loans with flexible repayment terms."
    },
    {
      icon: <GraduationCap className="w-6 h-6 text-purple-600" />,
      title: "Learn & Earn",
      description: "Complete financial literacy modules to earn badges and rewards."
    }
  ];

  return (
    <div className="min-h-screen bg-emerald-600 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center text-white mb-10"
        >
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black mb-2 text-white drop-shadow-sm">Welcome, {userName}!</h1>
          <p className="text-lg font-medium text-white">Your academic financial journey starts now.</p>
        </motion.div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Card className="p-5 flex gap-4 border-none shadow-xl bg-white/95 text-foreground backdrop-blur-sm rounded-2xl dark:bg-white/98 dark:text-foreground">
                <div className="flex-shrink-0 w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center dark:bg-slate-100">
                  {step.icon}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-tight mt-1 dark:text-foreground">{step.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10"
        >
          <Button 
            onClick={onContinue}
            className="w-full h-14 bg-white text-emerald-600 hover:bg-emerald-50 text-xl font-bold rounded-2xl shadow-2xl transition-all active:scale-[0.98]"
          >
            Go to Dashboard
            <ArrowRight className="w-6 h-6 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
