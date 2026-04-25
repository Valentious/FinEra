import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/app/components/ui/input-otp";
import { PhoneInputField } from "@/app/components/PhoneInputField";
import { FinEraBrandMark } from "@/app/components/FinEraBrandMark";
import { validateEmail, validatePhoneE164, validatePassword } from "@/lib/validation";
import { cn } from "@/app/components/ui/utils";
import { apiService } from "@/services/index";

const RESEND_SEC = 30;

type Step = "identify" | "otp" | "reset" | "success";
type ContactMode = "email" | "phone";

function maskDestination(mode: ContactMode, raw: string): string {
  const v = raw.trim();
  if (mode === "email") {
    const [u, d] = v.split("@");
    if (!d) return v.length > 4 ? `${v.slice(0, 2)}…` : v;
    const left = u.length <= 2 ? u[0] + "*" : `${u.slice(0, 2)}…`;
    return `${left}@${d}`;
  }
  if (v.length <= 4) return v || "your phone";
  return `${v.slice(0, 3)}…${v.slice(-2)}`;
}

interface ForgotPasswordFlowProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordFlow({ onBackToLogin }: ForgotPasswordFlowProps) {
  const [step, setStep] = useState<Step>("identify");
  const [contactMode, setContactMode] = useState<ContactMode>("email");
  const [emailValue, setEmailValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [identifyError, setIdentifyError] = useState("");

  const [maskedDestination, setMaskedDestination] = useState("");
  const [resetSessionToken, setResetSessionToken] = useState("");

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const identifier = contactMode === "email" ? emailValue.trim() : phoneValue.trim();

  const sendCode = async () => {
    setIdentifyError("");
    if (!identifier) {
      setIdentifyError("Enter your email or phone number.");
      return;
    }
    if (contactMode === "email") {
      if (!validateEmail(identifier)) {
        setIdentifyError("Enter a valid email address.");
        return;
      }
    } else if (!validatePhoneE164(identifier)) {
      setIdentifyError("Enter a valid phone number with country code.");
      return;
    }

    setSendLoading(true);
    try {
      await apiService.requestPasswordReset({
        channel: contactMode,
        email: contactMode === "email" ? identifier : undefined,
        phone: contactMode === "phone" ? identifier : undefined,
      });
      setResetSessionToken("");
      setMaskedDestination(maskDestination(contactMode, identifier));
      setOtp("");
      setOtpError("");
      setResendTimer(RESEND_SEC);
      setStep("otp");
    } catch (err) {
      setIdentifyError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSendLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendTimer > 0) return;
    setSendLoading(true);
    setOtpError("");
    try {
      await apiService.requestPasswordReset({
        channel: contactMode,
        email: contactMode === "email" ? identifier : undefined,
        phone: contactMode === "phone" ? identifier : undefined,
      });
      setResetSessionToken("");
      setResendTimer(RESEND_SEC);
      setOtp("");
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Could not resend. Try again.");
    } finally {
      setSendLoading(false);
    }
  };

  const verifyOtp = async () => {
    setOtpError("");
    if (otp.length !== 6) {
      setOtpError("Enter the full 6-digit code.");
      return;
    }
    setVerifyLoading(true);
    try {
      const { resetSessionToken: token } = await apiService.verifyPasswordResetOtp({
        channel: contactMode,
        email: contactMode === "email" ? identifier : undefined,
        phone: contactMode === "phone" ? identifier : undefined,
        code: otp,
      });
      setResetSessionToken(token);
      setStep("reset");
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "That code is incorrect. Try again or request a new code.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    if (newPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    const pw = validatePassword(newPassword);
    if (!pw.valid) {
      setResetError(pw.message || "Password does not meet requirements.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }
    if (!resetSessionToken) {
      setResetError("Your reset session expired. Go back and verify the code again.");
      return;
    }
    setResetLoading(true);
    try {
      await apiService.completePasswordReset({
        resetSessionToken,
        newPassword,
      });
      setResetSessionToken("");
      setStep("success");
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Could not update password. Try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const goBack = useCallback(() => {
    if (step === "otp") {
      setStep("identify");
      setOtp("");
      setOtpError("");
      setResetSessionToken("");
      setResendTimer(0);
      return;
    }
    if (step === "reset") {
      setStep("otp");
      setResetSessionToken("");
      setResetError("");
      return;
    }
    onBackToLogin();
  }, [step, onBackToLogin]);

  const primaryBtnClass =
    "w-full h-12 rounded-xl bg-primary font-semibold text-lg text-primary-foreground shadow-[0_20px_50px_rgba(37,211,102,0.18)] transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-60";

  const strengthHint = useMemo(() => {
    if (!newPassword) return null;
    if (newPassword.length < 8) return "Use at least 8 characters.";
    const r = validatePassword(newPassword);
    return r.valid ? "Looks good." : r.message;
  }, [newPassword]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-transparent p-4 pb-[max(1.5rem,calc(3.25rem+env(safe-area-inset-bottom,0px)))]">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-start">
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === "identify" ? "Back to sign in" : "Back"}
          </Button>
        </div>

        <div className="mb-8 flex flex-col items-center justify-center">
          <FinEraBrandMark surface="onLight" />
        </div>

        <AnimatePresence mode="wait">
          {step === "identify" && (
            <motion.div
              key="identify"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-xl shadow-slate-200/50">
                <CardHeader className="space-y-1 pt-8 text-center">
                  <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
                  <CardDescription className="text-balance">
                    Enter your email or phone number to receive a verification code
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 px-8 pb-8">
                  <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setContactMode("email");
                        setIdentifyError("");
                      }}
                      className={cn(
                        "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all",
                        contactMode === "email" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground",
                      )}
                    >
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setContactMode("phone");
                        setIdentifyError("");
                      }}
                      className={cn(
                        "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all",
                        contactMode === "phone" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground",
                      )}
                    >
                      Phone
                    </button>
                  </div>

                  {contactMode === "email" ? (
                    <div className="space-y-2">
                      <Label htmlFor="fp-email">Email</Label>
                      <Input
                        id="fp-email"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter email or phone number"
                        className="h-12 rounded-xl border-slate-200 focus-visible:ring-emerald-500/30"
                        value={emailValue}
                        onChange={(e) => {
                          setEmailValue(e.target.value);
                          setIdentifyError("");
                        }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="fp-phone">Phone</Label>
                      <PhoneInputField
                        id="fp-phone"
                        value={phoneValue}
                        onChange={(v) => {
                          setPhoneValue(v);
                          setIdentifyError("");
                        }}
                        placeholder="Enter email or phone number"
                        defaultCountry="zw"
                        inputClassName="!rounded-xl !border-slate-200 focus:!ring-emerald-500/30"
                        buttonClassName="!rounded-l-xl !border-slate-200"
                      />
                    </div>
                  )}

                  {identifyError ? <p className="text-sm font-medium text-red-600">{identifyError}</p> : null}

                  <Button type="button" disabled={sendLoading} className={primaryBtnClass} onClick={() => void sendCode()}>
                    {sendLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      "Send Code"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-xl shadow-slate-200/50">
                <CardHeader className="space-y-2 pt-8 text-center">
                  <CardTitle className="text-2xl font-bold">Verification</CardTitle>
                  <CardDescription className="text-balance text-sm leading-relaxed">
                    We&apos;ve sent a 6-digit code to <span className="font-semibold text-foreground">{maskedDestination}</span>.
                    Enter it below.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-8 pb-8 text-center">
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      pattern={REGEXP_ONLY_DIGITS}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otp}
                      onChange={(v) => {
                        setOtp(v.replace(/\D/g, "").slice(0, 6));
                        setOtpError("");
                      }}
                      pasteTransformer={(p) => p.replace(/\D/g, "").slice(0, 6)}
                      containerClassName="gap-2"
                    >
                      <InputOTPGroup className="gap-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className={cn(
                              "h-14 w-11 rounded-xl border-slate-200 text-lg font-bold transition-[box-shadow,border-color]",
                              "data-[active=true]:border-primary data-[active=true]:ring-2 data-[active=true]:ring-primary/25",
                            )}
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {otpError ? <p className="text-left text-sm font-medium text-red-600">{otpError}</p> : null}

                  <Button
                    type="button"
                    disabled={otp.length !== 6 || verifyLoading}
                    className={primaryBtnClass}
                    onClick={() => void verifyOtp()}
                  >
                    {verifyLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Didn&apos;t receive the code?</p>
                    {resendTimer > 0 ? (
                      <p>
                        Resend code in{" "}
                        <span className="font-semibold text-foreground">{resendTimer}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        disabled={sendLoading}
                        onClick={() => void resendCode()}
                        className="font-bold text-primary hover:underline disabled:opacity-50"
                      >
                        {sendLoading ? "Sending…" : "Resend Code"}
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "reset" && (
            <motion.div
              key="reset"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-xl shadow-slate-200/50">
                <CardHeader className="space-y-1 pt-8 text-center">
                  <CardTitle className="text-2xl font-bold">Create New Password</CardTitle>
                  <CardDescription>Minimum 8 characters. Use a strong, unique password.</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <form className="space-y-4" onSubmit={submitReset}>
                    <div className="space-y-2">
                      <Label htmlFor="fp-np">New Password</Label>
                      <div className="relative">
                        <Input
                          id="fp-np"
                          type={showPw ? "text" : "password"}
                          autoComplete="new-password"
                          className="h-12 rounded-xl border-slate-200 pr-11 focus-visible:ring-emerald-500/30"
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            setResetError("");
                          }}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                          onClick={() => setShowPw((s) => !s)}
                          aria-label={showPw ? "Hide password" : "Show password"}
                        >
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fp-cp">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="fp-cp"
                          type={showPw2 ? "text" : "password"}
                          autoComplete="new-password"
                          className="h-12 rounded-xl border-slate-200 pr-11 focus-visible:ring-emerald-500/30"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setResetError("");
                          }}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                          onClick={() => setShowPw2((s) => !s)}
                          aria-label={showPw2 ? "Hide password" : "Show password"}
                        >
                          {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {strengthHint ? (
                      <p className="text-xs font-medium text-muted-foreground">{strengthHint}</p>
                    ) : null}
                    {resetError ? <p className="text-sm font-medium text-red-600">{resetError}</p> : null}
                    <Button type="submit" disabled={resetLoading} className={primaryBtnClass}>
                      {resetLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "Reset Password"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-xl shadow-slate-200/50">
                <CardHeader className="space-y-2 pt-10 text-center">
                  <CardTitle className="text-2xl font-bold text-emerald-700">Password successfully reset</CardTitle>
                  <CardDescription>You can now sign in with your new password.</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-10">
                  <Button type="button" className={primaryBtnClass} onClick={onBackToLogin}>
                    Go to Login
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
