import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { FinEraBrandMark } from "@/app/components/FinEraBrandMark";
import { ArrowLeft, Building2, Sparkles } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/app/components/ui/toggle-group";

const BASE = import.meta.env.BASE_URL;

/** `public/images/…` — full-bleed watermarks; copy lives under `public/images/` */
const PROFESSIONAL_CARD_BG = `${BASE}images/account-type-professional.png`;
const STUDENT_CARD_BG = `${BASE}images/account-type-student.png`;
const BUSINESS_CARD_BG = `${BASE}images/account-type-business.png`;

export type AccountOperatingMode = "real" | "demo";

function AccountTypePhotoCard({
  onSelect,
  imageSrc,
  objectPositionClass,
  title,
  description,
}: {
  onSelect: () => void;
  imageSrc: string;
  objectPositionClass: string;
  title: string;
  description: string;
}) {
  return (
    <Card
      className="group relative min-h-[min(24rem,78vw)] cursor-pointer overflow-hidden border border-white/20 p-0 text-left shadow-lg ring-1 ring-slate-900/5 transition-all duration-500 hover:shadow-2xl hover:ring-whatsapp-green/30 md:min-h-[20rem]"
      onClick={onSelect}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <img
          src={imageSrc}
          alt=""
          className={`h-full w-full object-cover ${objectPositionClass} transition duration-700 ease-out group-hover:scale-[1.04]`}
          decoding="async"
        />
        <div className="absolute inset-0 bg-white/15 mix-blend-overlay" />
        <div
          className="absolute inset-0 bg-gradient-to-r from-white via-white/[0.93] to-white/10"
          style={{
            maskImage: "linear-gradient(90deg, black 0%, black min(60%, 18rem), transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(90deg, black 0%, black min(60%, 18rem), transparent 100%)",
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-whatsapp-green/[0.07] via-transparent to-slate-900/[0.04]"
          style={{
            maskImage: "radial-gradient(100% 90% at 0% 50%, black 0%, black 50%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(100% 90% at 0% 50%, black 0%, black 50%, transparent 100%)",
          }}
        />
      </div>

      <div className="relative z-10 flex h-full min-h-[18rem] flex-col justify-between gap-6 p-6 sm:min-h-[20rem] sm:p-7">
        <div className="space-y-3">
          <h3 className="max-w-[12.5rem] text-xl font-bold tracking-[-0.02em] text-black sm:max-w-none sm:text-2xl">
            {title}
          </h3>
          <p className="max-w-[20rem] text-balance text-[0.8rem] font-medium leading-[1.55] text-black sm:text-sm sm:leading-relaxed">
            {description}
          </p>
        </div>
        <Button
          className="w-full bg-whatsapp-green font-bold shadow-md transition group-hover:brightness-105 sm:py-5"
          type="button"
        >
          Select
        </Button>
      </div>
    </Card>
  );
}

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
          <p
            className={
              accountMode === "demo"
                ? "max-w-lg text-center text-sm font-bold leading-relaxed text-balance text-black"
                : "max-w-lg text-center text-xs font-black leading-relaxed text-balance text-black"
            }
          >
            {accountMode === "demo" ? (
              "Explore account - use the full digital journey with simulated balances. Upgrade to a real account when you are ready for live wallets and credit."
            ) : (
              <>
                REAL ACCOUNT: USE A STANDARD MEMBER ACCOUNT TO RECEIVE APPROVED LOANS IN REAL{" "}
                <span className="text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.25)]">
                  Fin<span className="font-black text-whatsapp-green">Cash</span> WALLETS.
                </span>
              </>
            )}
          </p>
        </div>

        <p className="text-center text-base font-bold text-balance text-black sm:text-lg">
          Select Your Account Type
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AccountTypePhotoCard
            onSelect={() => onSelectType("student", accountMode)}
            imageSrc={STUDENT_CARD_BG}
            objectPositionClass="object-[50%_22%] sm:object-[48%_20%]"
            title="Student Account"
            description="To support registered university students during delays in receiving financial support or allowances from parents or guardians by providing portal-based loans to cover daily needs such as food and healthcare."
          />

          <AccountTypePhotoCard
            onSelect={() => onSelectType("staff", accountMode)}
            imageSrc={PROFESSIONAL_CARD_BG}
            objectPositionClass="object-[65%_22%] sm:object-[58%_24%]"
            title="Professional Account"
            description="For formally employed people inclusive of SSB, ZRP and ZPCS subject to payroll deduction arrangement. These loans can be used for medical, building, school fees, and range up to 24 months to pay. Loan amount depends on net salary available."
          />

          <AccountTypePhotoCard
            onSelect={() => onSelectType("alumni", accountMode)}
            imageSrc={BUSINESS_CARD_BG}
            objectPositionClass="object-[52%_42%] sm:object-[50%_38%]"
            title="Business Account"
            description="For Sole traders and Small to Medium Enterprises, aimed at supporting their business needs through verified collateral/asset-based loans"
          />
        </div>
      </div>
    </div>
  );
}





