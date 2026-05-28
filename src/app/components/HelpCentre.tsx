/**
 * Route: /help-centre (screen: helpCentre)
 * Help & Support Centre - Provides resources and contact options
 */

import { motion } from "motion/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
  HelpCircle,
  MessageCircle,
  MessageSquare,
  ChevronRight,
  Scale,
} from "lucide-react";

interface HelpCentreProps {
  onBack?: () => void;
}

export function HelpCentre({ onBack }: HelpCentreProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in slide-in-from-bottom-4 duration-500 text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-foreground">Help & Support</h1>
        <p className="text-muted-foreground font-medium">Get assistance and resources when you need them</p>
      </div>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border shadow-lg rounded-2xl">
            <CardHeader className="border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Scale className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Responsible Trading</CardTitle>
                  <CardDescription>Learn about safe credit practices</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  We believe in responsible lending and borrowing. Understanding how to use credit wisely is essential for your financial health.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Borrow only what you need</li>
                  <li>Understand repayment terms before applying</li>
                  <li>Make payments on time to build your credit score</li>
                  <li>Keep track of your obligations</li>
                  <li>Contact us if you face difficulties</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border shadow-lg rounded-2xl">
            <CardHeader className="border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Get in Touch</CardTitle>
                  <CardDescription>Multiple ways to reach our support team</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <button
                onClick={() => toast.success("Opening WhatsApp...")}
                className="w-full p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">WhatsApp Support</p>
                    <p className="text-xs text-muted-foreground">Chat with our support team</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-green-600 transition-colors" />
              </button>

              <button
                onClick={() => toast.success("Starting live chat...")}
                className="w-full p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">Live Chat</p>
                    <p className="text-xs text-muted-foreground">Get instant help from our agents</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                </div>
              </button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border shadow-lg rounded-2xl">
            <CardHeader className="border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <HelpCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
                  <CardDescription>Find quick answers to common questions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <details className="group border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                  <summary className="flex items-center justify-between font-semibold text-foreground">
                    <span>How do I apply for credit?</span>
                    <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Visit the Dashboard, select the loan type you need, and follow the guided application process. You'll need to verify your identity and provide some basic information.
                  </p>
                </details>

                <details className="group border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                  <summary className="flex items-center justify-between font-semibold text-foreground">
                    <span>What's my credit limit?</span>
                    <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Your credit limit depends on your account type, discipline score, and financial history. Check your Dashboard to see your available credit limit.
                  </p>
                </details>

                <details className="group border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                  <summary className="flex items-center justify-between font-semibold text-foreground">
                    <span>How do I make a repayment?</span>
                    <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Go to the Repayment Dashboard, select your payment method, enter the amount, and confirm. You'll receive a confirmation email after a successful repayment.
                  </p>
                </details>

                <details className="group border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                  <summary className="flex items-center justify-between font-semibold text-foreground">
                    <span>What is my discipline score?</span>
                    <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Your discipline score reflects your credit behaviour. Making on-time repayments and maintaining good financial practices helps improve your score.
                  </p>
                </details>

                <details className="group border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                  <summary className="flex items-center justify-between font-semibold text-foreground">
                    <span>Can I change my password?</span>
                    <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Yes! Go to Account Settings, select the Security tab, and change your password. Use a strong password with a mix of letters, numbers, and symbols.
                  </p>
                </details>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            className="w-full rounded-xl"
          >
            Back to Dashboard
          </Button>
        )}
      </div>
    </div>
  );
}
