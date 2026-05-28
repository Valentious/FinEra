import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { FinEraLogoText } from "@/app/components/FinEraLogoText";
import { FinEraShieldIcon } from "@/app/components/FinEraShieldIcon";

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function WelcomeScreen({ onGetStarted, onSignIn }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 p-4">
      <Card className="max-w-2xl w-full p-12 text-center space-y-8">
        <div className="hero-header flex flex-col items-center justify-center text-center gap-4">
          <div className="flex flex-nowrap items-center justify-center gap-0">
            <FinEraShieldIcon size={56} className="shrink-0 rounded-xl" />
            <FinEraLogoText variant="light" size="xl" as="span" className="inline !m-0 align-middle leading-none" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="inclusive-text finera-inclusive-credit-tagline mb-0 mt-0 text-lg font-semibold uppercase tracking-[0.25em]">
              INCLUSIVE Micro-Loans
            </p>
            <p className="mb-0 mt-1 text-base font-medium text-muted-foreground">Formal Institutions Hub</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
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
