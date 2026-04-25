import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { FinEraBrandMark } from "@/app/components/FinEraBrandMark";

interface AdminLoginProps {
  onProceed: () => void;
  onBack: () => void;
}

export function AdminLogin({ onProceed, onBack }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProceed();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 p-4">
      <Card className="max-w-md w-full p-8">
        <div className="mb-6 flex justify-center">
          <FinEraBrandMark surface="onLight" showSubline={false} />
        </div>

        <h1 className="text-3xl text-center mb-8">Administrator Login</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg">
            Proceed
          </Button>

          <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
            Back
          </Button>
        </form>
      </Card>
    </div>
  );
}
