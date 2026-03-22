import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { GraduationCap, Briefcase, Users, ArrowLeft } from "lucide-react";
import { FinEraShieldIcon } from "@/app/components/FinEraShieldIcon";
import { FinEraLogoText } from "@/app/components/FinEraLogoText";

interface AccountTypeSelectionProps {
  onSelectType: (type: 'student' | 'staff' | 'alumni') => void;
  onBack?: () => void;
}

export function AccountTypeSelection({ onSelectType, onBack }: AccountTypeSelectionProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 p-4">
      <div className="max-w-5xl w-full space-y-8">
        {/* Back Button */}
        {onBack && (
          <div className="flex justify-start">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        )}

        {/* Logo/Badge */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="flex items-center gap-4 mb-4">
            <FinEraShieldIcon size={56} />
            <div className="hero-header flex flex-col items-center justify-center text-center">
              <FinEraLogoText variant="light" size="lg" className="font-black" />
              <p className="inclusive-text text-sm font-semibold text-slate-600 tracking-[0.2em] uppercase mt-2 mb-0">GLOBAL INCLUSIVE FINANCIAL SYSTEM</p>
              <p className="text-sm text-slate-600 font-medium mt-1 mb-0">For Formal Institutions/Organisation</p>
            </div>
          </div>
        </div>

        <h2 className="text-center text-4xl font-black text-slate-900">Choose Your Account Type</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            className="p-8 text-center space-y-4 cursor-pointer hover:shadow-lg transition-all hover:border-green-500"
            onClick={() => onSelectType('student')}
          >
            <div className="flex justify-center">
              <div className="p-4 bg-emerald-100 rounded-full">
                <GraduationCap className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-xl">Student Account</h3>
            <p className="text-slate-600">For registered university students</p>
            <Button className="w-full">Select</Button>
          </Card>

          <Card 
            className="p-8 text-center space-y-4 cursor-pointer hover:shadow-lg transition-all hover:border-green-500"
            onClick={() => onSelectType('staff')}
          >
            <div className="flex justify-center">
              <div className="p-4 bg-green-100 rounded-full">
                <Briefcase className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl">Staff Account</h3>
            <p className="text-slate-600">For confirmed academic or administrative staff</p>
            <Button className="w-full">Select</Button>
          </Card>

          <Card 
            className="p-8 text-center space-y-4 cursor-pointer hover:shadow-lg transition-all hover:border-green-500"
            onClick={() => onSelectType('alumni')}
          >
            <div className="flex justify-center">
              <div className="p-4 bg-purple-100 rounded-full">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <h3 className="text-xl">Alumni Account</h3>
            <p className="text-slate-600">For university graduates and alumni members</p>
            <Button className="w-full">Select</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
