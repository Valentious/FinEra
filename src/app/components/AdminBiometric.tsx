import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Fingerprint } from "lucide-react";

interface AdminBiometricProps {
  onVerify: () => void;
  onBack: () => void;
}

export function AdminBiometric({ onVerify, onBack }: AdminBiometricProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-6 bg-emerald-100 rounded-full animate-pulse">
            <Fingerprint className="w-16 h-16 text-emerald-600" />
          </div>
        </div>

        <h1 className="text-3xl mb-4">Biometric Verification</h1>
        
        <p className="text-slate-600 mb-8">
          Confirm identity using Face ID
        </p>

        <div className="space-y-4">
          <Button onClick={onVerify} className="w-full" size="lg">
            Verify Identity
          </Button>

          <Button variant="ghost" className="w-full" onClick={onBack}>
            Back
          </Button>
        </div>
      </Card>
    </div>
  );
}
