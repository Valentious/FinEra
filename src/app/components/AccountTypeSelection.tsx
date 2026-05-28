import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { FinEraBrandMark } from "@/app/components/FinEraBrandMark";
import { ArrowLeft } from "lucide-react";

const BASE = import.meta.env.BASE_URL;
const PROFESSIONAL_CARD_BG = `${BASE}images/account-type-professional.png`;
const STUDENT_CARD_BG = `${BASE}images/student-account-card-bg.png`;
const BUSINESS_CARD_BG = `${BASE}images/account-type-business.png`;

function AccountTypeCard({
  onSelect,
  imageSrc,
  objectPositionClass,
  watermarkTintClass,
  title,
  description,
}: {
  onSelect: () => void;
  imageSrc: string;
  objectPositionClass: string;
  watermarkTintClass: string;
  title: string;
  description: string;
}) {
  return (
    <Card
      className="group relative min-h-[min(21rem,75vw)] cursor-pointer overflow-hidden rounded-2xl border border-white/35 bg-white/90 p-0 text-left shadow-[0_14px_28px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(15,23,42,0.15)] md:min-h-[19rem]"
      onClick={onSelect}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <img
          src={imageSrc}
          alt=""
          decoding="async"
          className={`h-full w-full object-cover ${objectPositionClass} opacity-[0.72] transition duration-500 group-hover:opacity-[0.82]`}
        />
        <div className={`absolute inset-0 ${watermarkTintClass}`} />
        <div className="absolute inset-0 bg-gradient-to-r from-white/58 via-white/45 to-white/28" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/8 via-transparent to-white/4" />
      </div>

      <div className="relative z-10 flex h-full min-h-[18rem] flex-col justify-between gap-6 p-6 sm:min-h-[19rem] sm:p-7">
        <div className="space-y-3">
          <h3 className="max-w-[12.5rem] text-xl font-bold tracking-[-0.02em] text-slate-900 sm:max-w-none sm:text-2xl">
            {title}
          </h3>
          <p className="max-w-[20rem] text-balance text-[0.8rem] font-medium leading-[1.55] text-slate-700 sm:text-sm sm:leading-relaxed">
            {description}
          </p>
        </div>
        <Button
          className="w-full rounded-xl bg-whatsapp-green font-bold text-white shadow-md transition group-hover:brightness-105 sm:py-5"
          type="button"
        >
          Select
        </Button>
      </div>
    </Card>
  );
}

interface AccountTypeSelectionProps {
  onSelectType: (type: "student" | "staff" | "alumni") => void;
  onBack?: () => void;
}

export function AccountTypeSelection({ onSelectType, onBack }: AccountTypeSelectionProps) {

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-whatsapp-green-light to-whatsapp-green p-4">
      <div className="max-w-5xl w-full space-y-8">
        {onBack && (
          <div className="mb-4 flex justify-start">
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

        <div className="mb-8 flex w-full justify-center">
          <FinEraBrandMark surface="onLight" className="mb-0" />
        </div>

        <p className="text-center text-base font-bold text-balance text-black sm:text-lg">
          OPEN YOUR ACCOUNT
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AccountTypeCard
            onSelect={() => onSelectType("student")}
            imageSrc={STUDENT_CARD_BG}
            objectPositionClass="object-[50%_15%] sm:object-[50%_12%]"
            watermarkTintClass="bg-gradient-to-tr from-slate-900/22 via-emerald-300/14 to-sky-300/22"
            title="Student Account"
            description="Student Loans for students in partnered universities. Student account supports registered university students during periods of delay in receiving allowances from parents or guardians. The facility provides student portal-based loans (max 30 USD) to help cover daily needs such as food and healthcare. Repayment period: up to one month."
          />

          <AccountTypeCard
            onSelect={() => onSelectType("staff")}
            imageSrc={PROFESSIONAL_CARD_BG}
            objectPositionClass="object-[65%_22%] sm:object-[58%_24%]"
            watermarkTintClass="bg-gradient-to-tr from-emerald-300/24 via-slate-100/6 to-slate-400/24"
            title="Professional Account"
            description="Consumer loans that are collateral free and granted to formally employed people inclusive of SSB, ZRP and ZPCS subject to payroll deduction arrangement. These loans can be used for medical, building, school fees, and range up to 24 months to pay. Loan amount depend on net salary available."
          />

          <AccountTypeCard
            onSelect={() => onSelectType("alumni")}
            imageSrc={BUSINESS_CARD_BG}
            objectPositionClass="object-[52%_42%] sm:object-[50%_38%]"
            watermarkTintClass="bg-gradient-to-tr from-emerald-300/20 via-amber-100/8 to-amber-300/24"
            title="Business Account"
            description="This is working capital for Sole Traders, Small to Medium Enterprises and Corporate businesses, aimed at supporting business needs through collateral/asset-based loans."
          />
        </div>
      </div>
    </div>
  );
}





