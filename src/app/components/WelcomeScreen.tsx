import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { FinEraLogoText } from "@/app/components/FinEraLogoText";

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function WelcomeScreen({ onGetStarted, onSignIn }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 p-4">
      <Card className="max-w-2xl w-full p-12 text-center space-y-8">
        <div className="hero-header flex flex-col items-center justify-center text-center space-y-2">
          <FinEraLogoText variant="light" size="xl" />
          <p className="inclusive-text text-lg font-semibold text-slate-600 tracking-[0.25em] uppercase mt-2 mb-0">INCLUSIVE FINANCIAL ECOSYSTEM</p>
          <p className="text-base text-slate-600 font-medium mt-1 mb-0">for Formal Institutions/Organisation</p>
        </div>
        <div className="space-y-4">
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
