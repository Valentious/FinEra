import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { GraduationCap, Briefcase, Users, ArrowLeft, Building2, Sparkles } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-whatsapp-green-light to-whatsapp-green p-4">
      <div className="max-w-5xl w-full space-y-8">
        {onBack && (
          <div className="flex justify-start">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        )}

        <div className="flex w-full flex-col items-center gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <span className="text-base font-bold text-foreground">OPEN</span>
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
                className="rounded-lg px-5 py-2.5 text-sm font-black data-[state=on]:border-whatsapp-green data-[state=on]:bg-whatsapp-green data-[state=on]:text-white"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0" />
                  REAL
                </span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="demo"
                aria-label="Explore account"
                className="rounded-lg px-5 py-2.5 text-sm font-black data-[state=on]:border-explore-primary data-[state=on]:bg-explore-primary data-[state=on]:text-white"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  EXPLORE
                </span>
              </ToggleGroupItem>
            </ToggleGroup>
            <span className="text-base font-bold text-foreground">ACCOUNT</span>
          </div>
          <p className="max-w-md text-center text-xs font-black text-black">
            {accountMode === "demo"
              ? "EXPLORE: NO REAL MONEY MOVEMENT OR BINDING CREDIT OBLIGATIONS."
              : "REAL: STANDARD MEMBER ACCOUNT WITH ENFORCEABLE CREDIT POLICIES AND LIVE WALLETS."}
          </p>
        </div>

        <p className="text-center text-sm font-black uppercase tracking-widest text-black">Select member category</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className="p-8 text-center space-y-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-whatsapp-green"
            onClick={() => onSelectType("student", accountMode)}
          >
            <div className="flex justify-center">
              <div className="p-4 bg-emerald-100 rounded-full">
                <GraduationCap className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-xl">Student Account</h3>
            <p className="text-muted-foreground">For registered University students</p>
            <Button className="w-full">Select</Button>
          </Card>

          <Card
            className="p-8 text-center space-y-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-whatsapp-green"
            onClick={() => onSelectType("staff", accountMode)}
          >
            <div className="flex justify-center">
              <div className="p-4 bg-whatsapp-green-light rounded-full">
                <Briefcase className="w-8 h-8 text-whatsapp-green" />
              </div>
            </div>
            <h3 className="text-xl">Professional Account</h3>
            <p className="text-muted-foreground">For Formally Employed Individuals</p>
            <Button className="w-full">Select</Button>
          </Card>

          <Card
            className="p-8 text-center space-y-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-whatsapp-green"
            onClick={() => onSelectType("alumni", accountMode)}
          >
            <div className="flex justify-center">
              <div className="p-4 bg-explore-background rounded-full">
                <Users className="w-8 h-8 text-explore-primary" />
              </div>
            </div>
            <h3 className="text-xl">Sole Trader Account</h3>
            <p className="text-muted-foreground">For Enterprise Representatives</p>
            <Button className="w-full">Select</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}





