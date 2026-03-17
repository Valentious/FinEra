import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { GraduationCap, Briefcase, Users, Shield, ArrowLeft } from "lucide-react";

interface AccountTypeSelectionProps {
  onSelectType: (type: 'student' | 'staff' | 'alumni') => void;
  onBack?: () => void;
}

export function AccountTypeSelection({ onSelectType, onBack }: AccountTypeSelectionProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
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
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900">FinEra INCLUSIVE CREDIT</h1>
              <p className="text-sm text-slate-600 font-medium">For Formal Institutions/Organisation</p>
            </div>
          </div>
        </div>

        <h2 className="text-center text-4xl font-black text-slate-900">Choose Your Account Type</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            className="p-8 text-center space-y-4 cursor-pointer hover:shadow-lg transition-all hover:border-blue-500"
            onClick={() => onSelectType('student')}
          >
            <div className="flex justify-center">
              <div className="p-4 bg-blue-100 rounded-full">
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl">Student Account</h3>
            <p className="text-slate-600">For registered university students</p>
            <Button className="w-full">Select</Button>
          </Card>

          <Card 
            className="p-8 text-center space-y-4 cursor-pointer hover:shadow-lg transition-all hover:border-blue-500"
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
            className="p-8 text-center space-y-4 cursor-pointer hover:shadow-lg transition-all hover:border-blue-500"
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