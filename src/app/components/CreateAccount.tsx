import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { PhoneInputField } from "@/app/components/PhoneInputField";

interface CreateAccountProps {
  onContinue: (data: {
    fullName: string;
    idNumber: string;
    email: string;
    mobile: string;
    password: string;
  }) => void;
}

export function CreateAccount({ onContinue }: CreateAccountProps) {
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue({ fullName, idNumber, email, mobile, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
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