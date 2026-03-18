import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { PhoneInputField } from "@/app/components/PhoneInputField";

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

  const getDobMinMax = () => {
    const today = new Date();
    const maxD = new Date(today);
    maxD.setFullYear(maxD.getFullYear() - 16);
    const minD = new Date(today);
    minD.setFullYear(minD.getFullYear() - 120);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { min: fmt(minD), max: fmt(maxD) };
  };

  const validateAge = (dob: string): boolean => {
    if (!dob) return false;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 16;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateOfBirth) {
      setDobError("Date of birth is required");
      return;
    }
    if (!validateAge(dateOfBirth)) {
      setDobError("You must be at least 16 years old to register");
      return;
    }
    setDobError("");
    onContinue({ fullName, dateOfBirth, idNumber, email, mobile, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 p-4">
      <Card className="max-w-md w-full p-8">
        <h1 className="text-3xl text-center mb-8">Create Your Account</h1>
        
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

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => {
                setDateOfBirth(e.target.value);
                setDobError("");
              }}
              required
              {...getDobMinMax()}
              className={`h-12 rounded-lg cursor-pointer ${dobError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              aria-invalid={!!dobError}
            />
            {dobError && (
              <p className="text-sm text-red-600 font-medium">{dobError}</p>
            )}
          </div>

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
              onChange={setMobile}
              placeholder="Enter mobile number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Create Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg">
            Register
          </Button>
        </form>
      </Card>
    </div>
  );
}