import { Button } from "@/app/components/ui/button";
import { Building2, GraduationCap, Landmark, Wallet } from "lucide-react";
import type { AppAccountType, LoanType } from "@/loan/loanTypes";

/** White card, primary border, black text and icons (all account types) */
const loanCtaClassName =
  "w-full h-14 rounded-2xl font-black text-lg gap-2 border-2 border-primary bg-white text-black hover:bg-neutral-50 active:scale-[0.98] transition-all shadow-sm";

export interface LoanTypeSelectorProps {
  accountType: AppAccountType;
  onSelectLoanType: (loanType: LoanType) => void;
  disabled?: boolean;
}

export function LoanTypeSelector({ accountType, onSelectLoanType, disabled }: LoanTypeSelectorProps) {
  const isStaffOrBusiness = accountType === "staff" || accountType === "alumni";

  if (isStaffOrBusiness) {
    return (
      <div className="flex w-full flex-col gap-3">
        <Button type="button" disabled={disabled} onClick={() => onSelectLoanType("ASSET_BACKED")} className={loanCtaClassName}>
          <Landmark className="h-5 w-5 shrink-0 text-black" />
          Get Asset-Backed Loan
        </Button>
        <Button type="button" disabled={disabled} onClick={() => onSelectLoanType("SALARY_BACKED")} className={loanCtaClassName}>
          <Wallet className="h-5 w-5 shrink-0 text-black" />
          Get Salary-Backed Loan
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <Button type="button" disabled={disabled} onClick={() => onSelectLoanType("COLLATERAL")} className={loanCtaClassName}>
        <Building2 className="h-5 w-5 shrink-0 text-black" />
        Get Collateral Loan
      </Button>
      <Button type="button" disabled={disabled} onClick={() => onSelectLoanType("NON_COLLATERAL")} className={loanCtaClassName}>
        <GraduationCap className="h-5 w-5 shrink-0 text-black" />
        Get Non-Collateral Loan
      </Button>
    </div>
  );
}
