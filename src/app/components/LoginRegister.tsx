import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { DatePicker } from "@/app/components/ui/date-picker";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { PhoneInputField } from "@/app/components/PhoneInputField";
import { motion } from "motion/react";
import { LogIn, UserPlus, Mail, Lock, User, ArrowLeft } from "lucide-react";
import {
  validateInstitutionalEmail,
  validateStudentEmail,
  validateAge,
  validatePassword,
  isCompletePhoneNumber,
  PHONE_NUMBER_INCOMPLETE_MESSAGE,
} from "@/lib/validation";
import { toast } from "sonner";
import { PASSWORD_POLICY_HINT } from "@/lib/passwordPolicy";
import { FinEraBrandMark } from "@/app/components/FinEraBrandMark";
import { GoldCoinsAuthBackdrop } from "@/app/components/GoldCoinsAuthBackdrop";
import { Checkbox } from "@/app/components/ui/checkbox";
import { FINERA_REGISTRATION_CONSENT_VERSION } from "@/legal/consentVersion";

interface LoginRegisterProps {
  onLogin: (email: string, password?: string) => void;
  onRegister: (data: any) => void;
  onBack?: () => void;
  onForgotPassword?: () => void;
  /** Pre-selected account type from AccountTypeSelection - affects email label & validation */
  accountType?: 'student' | 'staff' | 'alumni';
  /** Practice (explore) vs live account - chosen on account type screen */
  accountMode?: 'real' | 'demo';
}

export function LoginRegister({
  onLogin,
  onRegister,
  onBack,
  onForgotPassword,
  accountType = "student",
  accountMode = "real",
}: LoginRegisterProps) {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    fullName: "",
    dateOfBirth: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [dobError, setDobError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [legalConsentAccepted, setLegalConsentAccepted] = useState(false);
  const [consentError, setConsentError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const latestPhoneRef = useRef("");
  latestPhoneRef.current = registerData.phoneNumber;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(loginData.email, loginData.password);
  };

  const passwordsMatch = registerData.password === registerData.confirmPassword;
  const showPasswordMismatch = registerData.confirmPassword.length > 0 && !passwordsMatch;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setConsentError("");
    setPhoneError("");
    if (!legalConsentAccepted) {
      setConsentError("You must accept the Terms of Service and Privacy Policy to create an account.");
      return;
    }
    if (registerData.password !== registerData.confirmPassword) return;
    if (!isCompletePhoneNumber(registerData.phoneNumber)) {
      setPhoneError(PHONE_NUMBER_INCOMPLETE_MESSAGE);
      toast.error(PHONE_NUMBER_INCOMPLETE_MESSAGE);
      return;
    }

    if (!registerData.dateOfBirth) {
      setDobError("Date of birth is required");
      return;
    }
    if (!validateAge(registerData.dateOfBirth)) {
      setDobError("You must be at least 18 years old to register");
      return;
    }
    setDobError("");
    setEmailError("");
    const isStudent = accountType === "student";
    const isValidEmail = isStudent
      ? validateStudentEmail(registerData.email)
      : validateInstitutionalEmail(registerData.email);
    if (!isValidEmail) {
      setEmailError(
        isStudent
          ? "Please use a valid university student email (e.g. @university.edu, .ac.zw), or a Google address (Gmail)"
          : "Please use a valid email address (e.g. .edu, .ac.*, .gov, your organisation domain, or Gmail / Google)"
      );
      return;
    }
    const pwCheck = validatePassword(registerData.password);
    if (!pwCheck.valid) {
      setPasswordError(pwCheck.message || "");
      return;
    }
    const { confirmPassword, ...rest } = registerData;
    onRegister({
      ...rest,
      country: "ZW",
      city: "",
      institution: "",
      termsAccepted: true,
      privacyPolicyAccepted: true,
      consentVersion: FINERA_REGISTRATION_CONSENT_VERSION,
    });
  };

  const emailLabel = accountType === "student" ? "University student email" : "Email";
  const emailPlaceholder =
    accountType === "student" ? "student@university.edu" : "you@example.com";

  return (
    <GoldCoinsAuthBackdrop>
      <div className="w-full">
        {/* Back Button */}
        {onBack && (
          <div className="flex justify-start mb-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 text-white/75 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Account Type
            </Button>
          </div>
        )}

        <div className="mb-8 flex w-full justify-center">
          <FinEraBrandMark surface="onDark" className="mb-0" />
        </div>

        {accountMode === "demo" && (
          <div className="mb-6 rounded-2xl border border-violet-300/35 bg-violet-950/45 px-4 py-3 text-center shadow-lg shadow-black/20 backdrop-blur-sm">
            <p className="text-sm font-semibold leading-snug text-violet-100">
              Explore account - use the full digital journey with simulated balances. Upgrade to a real account when you are ready for live wallets and credit.
            </p>
          </div>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2 rounded-xl border border-white/15 bg-white/10 p-1 shadow-inner shadow-black/20 backdrop-blur-md">
              <TabsTrigger
                value="login"
                className="rounded-lg text-white/75 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md data-[state=inactive]:hover:bg-white/5 data-[state=inactive]:hover:text-white"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-lg text-white/75 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md data-[state=inactive]:hover:bg-white/5 data-[state=inactive]:hover:text-white"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="overflow-hidden rounded-2xl border border-white/25 bg-white/[0.98] shadow-2xl shadow-black/45 backdrop-blur-sm">
                <CardHeader className="space-y-1 pt-8">
                  <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
                  <CardDescription className="text-center">
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pb-8 px-8">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="email" 
                          placeholder="name@university.edu" 
                          className="pl-10 h-12 rounded-lg border-slate-200 focus:ring-emerald-500"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          required 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        {onForgotPassword ? (
                          <Button
                            type="button"
                            variant="link"
                            className="px-0 h-auto text-xs text-emerald-600"
                            onClick={onForgotPassword}
                          >
                            Forgot password?
                          </Button>
                        ) : (
                          <Button variant="link" className="px-0 h-auto text-xs text-emerald-600">
                            Forgot password?
                          </Button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="password" 
                          type="password" 
                          className="pl-10 h-12 rounded-lg border-slate-200 focus:ring-emerald-500"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          required 
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-12 bg-primary hover:bg-emerald-700 rounded-xl font-semibold text-lg text-primary-foreground transition-all active:scale-[0.98]">
                      Sign In
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="overflow-hidden rounded-2xl border border-white/25 bg-white/[0.98] shadow-2xl shadow-black/45 backdrop-blur-sm">
                <CardHeader className="space-y-1 pt-8">
                  <CardTitle className="text-2xl font-bold text-center">Create Account Profile</CardTitle>
                  <CardDescription className="text-center">
                    Join the academic financial community
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pb-8 px-8">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="reg-name" 
                          placeholder="John Doe" 
                          className="pl-10 h-12 rounded-lg"
                          value={registerData.fullName}
                          onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                          required 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <DatePicker
                        id="reg-dob"
                        value={registerData.dateOfBirth}
                        onChange={(v) => {
                          setRegisterData({ ...registerData, dateOfBirth: v });
                          setDobError("");
                        }}
                        minAge={18}
                        maxAge={100}
                        error={dobError}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-phone">Phone Number</Label>
                      <PhoneInputField
                        id="reg-phone"
                        value={registerData.phoneNumber}
                        onChange={(value) => {
                          latestPhoneRef.current = value;
                          setRegisterData({ ...registerData, phoneNumber: value });
                          setPhoneError("");
                        }}
                        onBlur={() => {
                          const p = latestPhoneRef.current;
                          if (p.trim().length > 0 && !isCompletePhoneNumber(p)) {
                            setPhoneError(PHONE_NUMBER_INCOMPLETE_MESSAGE);
                          }
                        }}
                        placeholder="Enter phone number"
                        required
                        inputClassName={`focus:!ring-emerald-500 focus:!border-emerald-500 ${
                          phoneError ? "!border-red-500" : "!border-slate-200"
                        }`}
                        buttonClassName="!border-slate-200"
                      />
                      {phoneError ? <p className="text-sm font-medium text-red-600">{phoneError}</p> : null}
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="reg-email">{emailLabel}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder={emailPlaceholder}
                          className={`pl-10 h-12 rounded-lg ${emailError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          value={registerData.email}
                          onChange={(e) => {
                            const v = e.target.value;
                            setRegisterData({ ...registerData, email: v });
                            setEmailError("");
                          }}
                          required
                        />
                      </div>
                      {emailError && <p className="text-sm text-red-600 font-medium">{emailError}</p>}
                      <p className="text-xs text-muted-foreground">
                        After you create your account, we will send a 6-digit code to this address on the next step.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Create Password</Label>
                      <p className="text-xs text-muted-foreground">{PASSWORD_POLICY_HINT}</p>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="reg-password"
                          type="password"
                          className={`pl-10 h-12 rounded-lg ${passwordError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          value={registerData.password}
                          onChange={(e) => {
                            setRegisterData({ ...registerData, password: e.target.value });
                            setPasswordError("");
                          }}
                          required
                          autoComplete="new-password"
                        />
                      </div>
                      {passwordError && <p className="text-sm text-red-600 font-medium">{passwordError}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="reg-confirm-password" 
                          type="password" 
                          className={`pl-10 h-12 rounded-lg ${showPasswordMismatch ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                          required 
                        />
                      </div>
                      {showPasswordMismatch && (
                        <p className="text-sm text-red-600 font-medium">Passwords do not match</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div
                        className={`flex gap-3 rounded-xl border bg-muted/30 p-3 ${consentError ? "border-red-500/80" : "border-slate-200"}`}
                      >
                        <Checkbox
                          id="finera-legal-consent"
                          checked={legalConsentAccepted}
                          onCheckedChange={(v) => {
                            setLegalConsentAccepted(v === true);
                            setConsentError("");
                          }}
                          className="mt-0.5 size-5 shrink-0"
                          aria-invalid={!!consentError}
                        />
                        <label htmlFor="finera-legal-consent" className="cursor-pointer text-sm leading-snug text-foreground">
                          I have read and agree to the{" "}
                          <Link
                            to="/legal/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-emerald-600 underline underline-offset-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link
                            to="/legal/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-emerald-600 underline underline-offset-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Privacy Policy
                          </Link>
                          .
                        </label>
                      </div>
                      {consentError ? <p className="text-sm font-medium text-red-600">{consentError}</p> : null}
                    </div>
                    <Button 
                      type="submit" 
                      disabled={showPasswordMismatch || !legalConsentAccepted}
                      className="w-full h-12 bg-primary hover:bg-emerald-700 rounded-xl font-semibold text-lg text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Account Profile
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </GoldCoinsAuthBackdrop>
  );
}