import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/app/components/ui/input-otp";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { apiService } from "@/services";
import { FinEraShieldIcon } from "@/app/components/FinEraShieldIcon";
import { FinEraLogoText } from "@/app/components/FinEraLogoText";
import { DashboardTrustRibbon } from "@/app/components/DashboardTrustRibbon";

const RESEND_COOLDOWN_SEC = 30;

function trustRibbonAccountMode(): "real" | "demo" {
  try {
    const s = sessionStorage.getItem("finera_pre_account_mode");
    if (s === "demo" || s === "real") return s;
  } catch {
    /* ignore */
  }
  return "real";
}

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromQuery = (searchParams.get("email") || "").trim().toLowerCase();

  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setEmail(emailFromQuery);
  }, [emailFromQuery]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const canSubmit = email.includes("@") && code.length === 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const result = await apiService.verifyRegistrationEmail(email, code);
      const payload = {
        user: result.user,
        nextScreen: "verify" as const,
      };
      sessionStorage.setItem("finera_post_verify", JSON.stringify(payload));
      toast.success(result.message || "Email verified. Welcome!");
      navigate("/?continue=onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = useCallback(async () => {
    if (resendTimer > 0 || !email.includes("@")) return;
    setResending(true);
    setError("");
    try {
      const r = await apiService.resendOTP(email);
      setResendTimer(RESEND_COOLDOWN_SEC);
      toast.success(r.message || "Code sent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend code.");
    } finally {
      setResending(false);
    }
  }, [email, resendTimer]);

  const goChangeEmail = () => {
    navigate("/?resume=register");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 pb-[max(1.5rem,calc(3.25rem+env(safe-area-inset-bottom,0px)))]">
      <div className="w-full max-w-md">
        <div className="flex justify-start mb-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 text-slate-600">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        <div className="flex justify-center mb-8">
          <div className="flex flex-col items-center gap-4">
            <FinEraShieldIcon size={48} className="rounded-xl" />
            <div className="hero-header flex flex-col items-center text-center">
              <FinEraLogoText variant="light" size="md" />
              <p className="inclusive-text text-xs font-semibold text-slate-600 tracking-[0.2em] uppercase mt-2 mb-0">
                VERIFY YOUR EMAIL
              </p>
            </div>
          </div>
        </div>

        <Card className="border-slate-200 shadow-xl rounded-2xl">
          <CardHeader className="space-y-1 pt-8">
            <CardTitle className="text-2xl font-bold text-center">Enter the code we sent you</CardTitle>
            <CardDescription className="text-center">
              We sent a 6-digit code to your email. It expires in a few minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-8 px-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ve-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="ve-email"
                    type="email"
                    autoComplete="email"
                    className="pl-10 h-12 rounded-lg"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value.trim().toLowerCase());
                      setError("");
                    }}
                    placeholder="you@university.edu"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>6-digit code</Label>
                <InputOTP maxLength={6} value={code} onChange={(v) => { setCode(v); setError(""); }}>
                  <InputOTPGroup className="gap-1.5 justify-center">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="w-10 h-12 text-lg font-semibold rounded-lg border-slate-200"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {error && <p className="text-sm text-red-600 font-medium text-center">{error}</p>}

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-emerald-700 rounded-xl font-semibold text-lg"
                disabled={!canSubmit || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    Verifying…
                  </>
                ) : (
                  "Verify & continue"
                )}
              </Button>
            </form>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg"
                disabled={resending || !email.includes("@") || resendTimer > 0}
                onClick={() => void handleResend()}
              >
                {resending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    Sending…
                  </>
                ) : resendTimer > 0 ? (
                  `Resend in ${resendTimer}s`
                ) : (
                  "Resend code"
                )}
              </Button>
              <button
                type="button"
                className="text-emerald-700 font-medium hover:underline text-left"
                onClick={goChangeEmail}
              >
                Use a different email
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
      <DashboardTrustRibbon accountMode={trustRibbonAccountMode()} insetForSidebar={false} />
    </div>
  );
}
