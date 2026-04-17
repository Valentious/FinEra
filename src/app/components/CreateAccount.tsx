"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { PhoneInputField } from "@/app/components/PhoneInputField";
import { DateOfBirthField } from "@/app/components/ui/date-of-birth-field";
import { DOB, dobErrorMessage, validateDobIso } from "@/lib/dob";
import {
  validatePassword,
  isCompletePhoneNumber,
  PHONE_NUMBER_INCOMPLETE_MESSAGE,
} from "@/lib/validation";
import { toast } from "sonner";
import { PASSWORD_POLICY_HINT } from "@/lib/passwordPolicy";
import { MapPin } from "lucide-react";

interface CreateAccountProps {
  onContinue: (data: {
    fullName: string;
    dateOfBirth: string;
    idNumber: string;
    email: string;
    mobile: string;
    password: string;
  }) => void;
}

export function CreateAccount({ onContinue }: CreateAccountProps) {
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [dobError, setDobError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const latestMobileRef = useRef("");
  latestMobileRef.current = mobile;

  const localeMode = useMemo((): "en-GB" | "en-US" => {
    if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("en-us")) {
      return "en-US";
    }
    return "en-GB";
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dobCheck = validateDobIso(dateOfBirth, DOB.MIN_AGE_YEARS, DOB.MAX_AGE_YEARS);
    if (!dobCheck.ok) {
      setDobError(dobErrorMessage(dobCheck.error));
      return;
    }
    setDobError("");

    if (!isCompletePhoneNumber(mobile)) {
      setPhoneError(PHONE_NUMBER_INCOMPLETE_MESSAGE);
      toast.error(PHONE_NUMBER_INCOMPLETE_MESSAGE);
      return;
    }
    setPhoneError("");
    const pw = validatePassword(password);
    if (!pw.valid) {
      setPasswordError(pw.message || "");
      return;
    }
    setPasswordError("");
    onContinue({
      fullName,
      dateOfBirth: dobCheck.iso,
      idNumber,
      email,
      mobile,
      password,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 p-4">
      <Card className="max-w-md w-full p-8">
        <h1 className="text-3xl text-center mb-6">Create Your Account</h1>

        <div
          className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-left"
          role="img"
          aria-label="Zimbabwe default location"
        >
          <MapPin className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-900">Zimbabwe (Default)</p>
            <p className="text-xs text-muted-foreground">Onboarding location is preset to Zimbabwe.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <DateOfBirthField
            id="create-account-dob"
            value={dateOfBirth}
            onChange={(iso) => {
              setDateOfBirth(iso);
              setDobError("");
            }}
            error={dobError}
            localeMode={localeMode}
            minAge={DOB.MIN_AGE_YEARS}
            maxAge={DOB.MAX_AGE_YEARS}
          />

          <div className="space-y-2">
            <Label htmlFor="idNumber">ID Number</Label>
            <Input
              id="idNumber"
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <PhoneInputField
              id="mobile"
              value={mobile}
              onChange={(value) => {
                latestMobileRef.current = value;
                setMobile(value);
                setPhoneError("");
              }}
              onBlur={() => {
                const p = latestMobileRef.current;
                if (p.trim().length > 0 && !isCompletePhoneNumber(p)) {
                  setPhoneError(PHONE_NUMBER_INCOMPLETE_MESSAGE);
                }
              }}
              placeholder="Enter mobile number"
              required
              inputClassName={phoneError ? "!border-red-500" : ""}
            />
            {phoneError ? <p className="text-sm font-medium text-red-600">{phoneError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Create Password</Label>
            <p className="text-xs text-muted-foreground">{PASSWORD_POLICY_HINT}</p>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError("");
              }}
              className={passwordError ? "border-red-500" : ""}
              required
              autoComplete="new-password"
            />
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          </div>

          <Button type="submit" className="w-full" size="lg">
            Register
          </Button>
        </form>
      </Card>
    </div>
  );
}
