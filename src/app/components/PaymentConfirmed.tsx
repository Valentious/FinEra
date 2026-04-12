import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface PaymentConfirmedProps {
  onReturnToDashboard: () => void;
}

export function PaymentConfirmed({ onReturnToDashboard }: PaymentConfirmedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 p-4">
      <Card className="max-w-lg w-full p-8">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="w-20 h-20 text-green-500" />
        </div>
        
        <h1 className="text-3xl text-center mb-4">Payment Received</h1>
        
        <p className="text-center text-muted-foreground mb-8">
          Your repayment is being processed. Your account will be updated once the payment is verified.
        </p>

        <Button onClick={onReturnToDashboard} className="w-full" size="lg">
          Return to Dashboard
        </Button>
      </Card>
    </div>
  );
}
