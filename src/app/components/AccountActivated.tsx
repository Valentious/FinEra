import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface AccountActivatedProps {
  onContinue: () => void;
}

export function AccountActivated({ onContinue }: AccountActivatedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-whatsapp-green-light to-whatsapp-green p-4">
      <Card className="max-w-lg w-full p-8">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="w-20 h-20 text-whatsapp-green" />
        </div>
        
        <h1 className="text-3xl text-center mb-8">Account Successfully Activated</h1>
        
        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="p-4 bg-whatsapp-green-light rounded-lg border border-whatsapp-green">
            <div className="flex justify-between items-center">
              <span className="text-foreground">Membership</span>
              <span className="text-whatsapp-green font-semibold">Active</span>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex justify-between items-center">
              <span className="text-foreground">FinCash Wallet</span>
              <span className="text-emerald-600 font-semibold">Active</span>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex justify-between items-center">
              <span className="text-foreground">Credit Access</span>
              <span className="text-purple-600 font-semibold">Ready</span>
            </div>
          </div>
        </div>

        <Button onClick={onContinue} className="w-full" size="lg">
          Go to Dashboard
        </Button>
      </Card>
    </div>
  );
}
