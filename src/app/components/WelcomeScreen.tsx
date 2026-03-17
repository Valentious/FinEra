import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function WelcomeScreen({ onGetStarted, onSignIn }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="max-w-2xl w-full p-12 text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl">FinEra INCLUSIVE CREDIT for Formal Institutions/Organisation</h1>
          <div className="flex items-center justify-center gap-3 text-slate-600">
            <span>Secure</span>
            <span>•</span>
            <span>Ethical</span>
            <span>•</span>
            <span>Data-Driven</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Button size="lg" onClick={onGetStarted} className="px-8">
            Get Started
          </Button>
          <Button size="lg" variant="outline" onClick={onSignIn} className="px-8">
            Sign In
          </Button>
        </div>
      </Card>
    </div>
  );
}
