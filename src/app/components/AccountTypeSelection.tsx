import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { GraduationCap, Briefcase, Users, ArrowLeft, Building2, Sparkles } from "lucide-react";
import { FinEraShieldIcon } from "@/app/components/FinEraShieldIcon";
import { FinEraLogoText } from "@/app/components/FinEraLogoText";
import { ToggleGroup, ToggleGroupItem } from "@/app/components/ui/toggle-group";

export type AccountOperatingMode = "real" | "demo";

interface AccountTypeSelectionProps {
  onSelectType: (type: "student" | "staff" | "alumni", accountMode: AccountOperatingMode) => void;
  onBack?: () => void;
  accountMode: AccountOperatingMode;
  onAccountModeChange: (mode: AccountOperatingMode) => void;
}

export function AccountTypeSelection({
  onSelectType,
  onBack,
  accountMode,
  onAccountModeChange,
}: AccountTypeSelectionProps) {

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 p-4">
      <div className="max-w-5xl w-full space-y-8">
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

        <div className="flex flex-col items-center justify-center mb-6">
          <div className="flex flex-col items-center gap-4 mb-4">
            <FinEraShieldIcon size={56} />
            <div className="hero-header flex flex-col items-center justify-center text-center">
              <FinEraLogoText variant="light" size="lg" className="font-black" />
              <p className="inclusive-text text-sm font-semibold text-slate-600 tracking-[0.2em] uppercase mt-2 mb-0">
                INCLUSIVE CREDIT
              </p>
              <p className="text-sm text-slate-600 font-medium mt-1 mb-0">Formal Institutions Hub</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Operating mode</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <span className="text-base font-bold text-slate-800">Select</span>
            <ToggleGroup
              type="single"
              value={accountMode}
              onValueChange={(v) => {
                if (v === "real" || v === "demo") onAccountModeChange(v);
              }}
              variant="outline"
              className="rounded-xl border-2 border-slate-200 bg-white p-1 shadow-sm"
            >
              <ToggleGroupItem
                value="real"
                aria-label="Real account"
                className="rounded-lg px-5 py-2.5 text-sm font-black data-[state=on]:border-emerald-600 data-[state=on]:bg-emerald-600 data-[state=on]:text-white"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0" />
                  Real
                </span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="demo"
                aria-label="Demo account"
                className="rounded-lg px-5 py-2.5 text-sm font-black data-[state=on]:border-violet-600 data-[state=on]:bg-violet-600 data-[state=on]:text-white"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  Demo
                </span>
              </ToggleGroupItem>
            </ToggleGroup>
            <span className="text-base font-bold text-slate-800">account</span>
          </div>
          <p className="max-w-md text-center text-xs font-medium text-slate-500">
            {accountMode === "demo"
              ? "Demo: no real money movement or binding credit obligations."
              : "Real: standard member account with live wallets and enforceable credit policies."}
          </p>
        </div>

        <p className="text-center text-sm font-black uppercase tracking-widest text-slate-600">Select member category</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className="p-8 text-center space-y-4 cursor-pointer hover:shadow-lg transition-all hover:border-green-500"
            onClick={() => onSelectType("student", accountMode)}
          >
            <div className="flex justify-center">
              <div className="p-4 bg-emerald-100 rounded-full">
                <GraduationCap className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-xl">Student Account</h3>
            <p className="text-slate-600">For registered students</p>
            <Button className="w-full">Select</Button>
          </Card>

          <Card
            className="p-8 text-center space-y-4 cursor-pointer hover:shadow-lg transition-all hover:border-green-500"
            onClick={() => onSelectType("staff", accountMode)}
          >
            <div className="flex justify-center">
              <div className="p-4 bg-green-100 rounded-full">
                <Briefcase className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl">Staff Account</h3>
            <p className="text-slate-600">For confirmed administrative staff</p>
            <Button className="w-full">Select</Button>
          </Card>

          <Card
            className="p-8 text-center space-y-4 cursor-pointer hover:shadow-lg transition-all hover:border-green-500"
            onClick={() => onSelectType("alumni", accountMode)}
          >
            <div className="flex justify-center">
              <div className="p-4 bg-purple-100 rounded-full">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <h3 className="text-xl">Employer/Alumni Account</h3>
            <p className="text-slate-600">For Approved Employers/Alumni</p>
            <Button className="w-full">Select</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
