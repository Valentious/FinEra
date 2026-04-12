import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/app/components/ui/input-otp";
import { ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";

interface OTPVerificationProps {
  email: string;
  onVerify: () => void;
  onBack: () => void;
}

export function OTPVerification({ email, onVerify, onBack }: OTPVerificationProps) {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerify = () => {
    if (otp.length === 6) {
      setIsVerifying(true);
      // Simulate API call
      setTimeout(() => {
        setIsVerifying(false);
        setIsSuccess(true);
        setTimeout(onVerify, 1500);
      }, 2000);
    }
  };

  const resendOTP = () => {
    setTimer(60);
    // Logic to resend OTP
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-transparent p-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" className="mb-6 -ml-2 text-muted-foreground hover:text-emerald-600" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to registration
        </Button>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Card className="border-slate-200 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="text-center pt-10">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <RefreshCw className={`w-8 h-8 text-emerald-600 ${isVerifying ? 'animate-spin' : ''}`} />
              </div>
              <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
              <CardDescription className="max-w-[280px] mx-auto mt-2">
                We've sent a 6-digit code to <br />
                <span className="font-semibold text-foreground">{email}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-10 px-8 text-center">
              <div className="flex justify-center mb-8">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                  onComplete={handleVerify}
                >
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={0} className="w-12 h-14 text-xl font-bold rounded-xl border-slate-200" />
                    <InputOTPSlot index={1} className="w-12 h-14 text-xl font-bold rounded-xl border-slate-200" />
                    <InputOTPSlot index={2} className="w-12 h-14 text-xl font-bold rounded-xl border-slate-200" />
                    <InputOTPSlot index={3} className="w-12 h-14 text-xl font-bold rounded-xl border-slate-200" />
                    <InputOTPSlot index={4} className="w-12 h-14 text-xl font-bold rounded-xl border-slate-200" />
                    <InputOTPSlot index={5} className="w-12 h-14 text-xl font-bold rounded-xl border-slate-200" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {isSuccess ? (
                <div className="flex flex-col items-center gap-2 text-green-600 animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="w-12 h-12" />
                  <p className="font-bold">Verification Successful!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <Button 
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-lg"
                    disabled={otp.length !== 6 || isVerifying}
                    onClick={handleVerify}
                  >
                    {isVerifying ? 'Verifying...' : 'Verify & Continue'}
                  </Button>

                  <div className="text-sm text-muted-foreground">
                    Didn't receive the code? {" "}
                    {timer > 0 ? (
                      <span className="text-emerald-600 font-medium">Resend in {timer}s</span>
                    ) : (
                      <button onClick={resendOTP} className="text-emerald-600 font-bold hover:underline">Resend Now</button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
