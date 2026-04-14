import { useState, useLayoutEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  ShieldCheck,
  Award,
  Coins,
  Send,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  CURRENCY_AMOUNT_SYMBOLS,
  formatAmountWithCurrency,
  formatAmountWithSymbol,
} from "@/types/wallet";
import {
  finAmountHero,
  finAmountLedger,
  finAmountPrimary,
} from "@/lib/financialTypography";
import { LoanTypeSelector } from "@/app/components/LoanTypeSelector";
import { QuickActionsPanel } from "@/app/components/QuickActionsPanel";
import type { AppAccountType, LoanType } from "@/loan/loanTypes";
import {
  onDisciplineGradientButtonOutline,
  onDisciplineGradientGlass,
  onDisciplineGradientIcon,
  onDisciplineGradientMuted,
  onDisciplineGradientOrb,
  onDisciplineGradientPill,
  onDisciplineGradientText,
  onDisciplineGradientShellShadow,
  onDisciplineGradientTrack,
  onDisciplineGradientTrackFill,
} from "@/lib/disciplineGradient";
import { FinEraShieldIcon } from "@/app/components/FinEraShieldIcon";

export type CurrencyOption = "USD" | "ZIG" | "ZAR" | "EUR" | "GBP";

const DEFAULT_CURRENCY_SYMBOLS: Record<string, string> = {
  ...CURRENCY_AMOUNT_SYMBOLS,
};

function exportLedgerToCsv(
  transactions: { id: string; type: string; amount: number; date: string; description: string; currency?: string }[],
  symbol: string,
  currencyCode: string
) {
  if (transactions.length === 0) {
    toast.info(`No ${currencyCode} ledger activity to export yet.`);
    return;
  }
  const headers = "Date,Type,Description,Amount,Currency\n";
  const rows = transactions
    .slice()
    .reverse()
    .map(
      (t) =>
        `${new Date(t.date).toLocaleDateString()},"${t.type}","${(t.description || "").replace(/"/g, '""')}",${t.type === "deposit" ? "+" : "-"}${formatAmountWithSymbol(symbol, t.amount)},"${currencyCode}"`
    )
    .join("\n");
  const csv = headers + rows;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ledger-${currencyCode}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`${currencyCode} ledger exported.`);
}

export interface CurrencyTab {
  currencyCode: string;
  displayName: string;
  symbol: string;
  status?: string;
  custodyType?: string;
  dashboardConfig?: Record<string, unknown>;
}

interface DashboardV2Props {
  userName: string;
  walletBalance: number;
  /** e.g. FinCash USD Wallet - must match active dashboard currency */
  walletLabel: string;
  activeCredit: number;
  availableCreditLimit: number;
  disciplineScore: number;
  creditScore: number;
  loyaltyProgress: number;
  selectedCurrency?: CurrencyOption;
  onCurrencyChange?: (c: CurrencyOption) => void;
  displayAccountNumber?: string;
  /** Drives which loan buttons are shown (student vs staff vs business representative). */
  accountType: AppAccountType;
  onSelectLoanType: (loanType: LoanType) => void;
  onAddSavings: () => void;
  onViewRepayment: () => void;
  onWithdrawFunds: () => void;
  /** Opens make-repayment flow (dashboard card shortcut). */
  onMakeRepayment?: () => void;
  onMakePayment?: () => void;
  onPeerTransfer?: () => void;
  transactions: any[];
  /** Dynamic currency dashboards from API - renders tabs from this list */
  currencyTabs?: CurrencyTab[];
  /** Currency-specific rules (from dashboard_config) */
  dashboardConfig?: Record<string, unknown>;
}

/** TrustScore / discipline bands (0–100): matches card gradient + ring colors. */
const TRUST_SCORE_BANDS = [
  {
    min: 80,
    max: 100,
    label: "Excellent",
    short: "Deep green",
    description: "Strong repayment history and consistent wallet behaviour. Best access to credit terms.",
    swatchClass: "bg-primary",
  },
  {
    min: 65,
    max: 79,
    label: "Strong",
    short: "Green",
    description: "Good discipline. Keep funding your wallet and paying on time to move into Excellent.",
    swatchClass: "bg-primary/80",
  },
  {
    min: 50,
    max: 64,
    label: "Fair",
    short: "Amber",
    description: "Room to improve. Focus on on-time repayments and fewer missed cycles.",
    swatchClass: "bg-amber-500",
  },
  {
    min: 0,
    max: 49,
    label: "Building",
    short: "Red",
    description: "Higher risk band. Improve with regular deposits and clearing arrears.",
    swatchClass: "bg-red-500",
  },
] as const;

function trustScoreBandIndex(score: number): number {
  if (score >= 80) return 0;
  if (score >= 65) return 1;
  if (score >= 50) return 2;
  return 3;
}

function getDisciplineScoreRingColor(score: number): string {
  if (score >= 80) return "#25D366";
  if (score >= 65) return "#1ebe5d";
  if (score >= 50) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

// Helper function to get credit score tier
function getCreditScoreTier(score: number): { tier: string; color: string; bgColor: string } {
  if (score >= 85) return { tier: "Elite", color: "text-purple-600", bgColor: "bg-purple-100" };
  if (score >= 70) return { tier: "Growth", color: "text-primary", bgColor: "bg-primary-light" };
  if (score >= 50) return { tier: "Standard", color: "text-primary", bgColor: "bg-primary-light" };
  if (score >= 30) return { tier: "Watch", color: "text-amber-600", bgColor: "bg-amber-100" };
  return { tier: "Restricted", color: "text-red-600", bgColor: "bg-red-100" };
}

// Helper function to get SFIS eligibility tier based on behavioral analytics
function getSFISEligibilityTier(score: number): { tier: string; color: string; bgColor: string; description: string } {
  if (score >= 85) return { 
    tier: "Excellent", 
    color: "text-purple-600", 
    bgColor: "bg-purple-100",
    description: "Maximum credit access & priority support"
  };
  if (score >= 70) return { 
    tier: "Good", 
    color: "text-primary", 
    bgColor: "bg-primary-light",
    description: "Strong eligibility & competitive terms"
  };
  if (score >= 50) return { 
    tier: "Fair", 
    color: "text-primary", 
    bgColor: "bg-primary-light",
    description: "Standard eligibility & terms"
  };
  if (score >= 30) return { 
    tier: "Building", 
    color: "text-amber-600", 
    bgColor: "bg-amber-100",
    description: "Limited access, building trust"
  };
  return { 
    tier: "Restricted", 
    color: "text-red-600", 
    bgColor: "bg-red-100",
    description: "Requires wallet balance improvement"
  };
}

export function DashboardV2({
  userName,
  walletBalance,
  walletLabel,
  activeCredit,
  availableCreditLimit,
  disciplineScore,
  creditScore,
  loyaltyProgress: loyaltyProgressRaw,
  selectedCurrency = 'USD',
  onCurrencyChange,
  displayAccountNumber,
  accountType,
  onSelectLoanType,
  onAddSavings,
  onViewRepayment,
  onWithdrawFunds,
  onMakeRepayment,
  onMakePayment,
  onPeerTransfer,
  transactions,
  currencyTabs,
  dashboardConfig = {},
}: DashboardV2Props) {
  const safeAvailableCreditLimit = Number.isFinite(Number(availableCreditLimit)) ? Number(availableCreditLimit) : 0;
  const safeWalletBalance = Number.isFinite(Number(walletBalance)) ? Number(walletBalance) : 0;
  const safeActiveCredit = Number.isFinite(Number(activeCredit)) ? Number(activeCredit) : 0;
  const safeDisciplineScore = Number.isFinite(Number(disciplineScore)) ? Number(disciplineScore) : 50;
  const safeCreditScore = Number.isFinite(Number(creditScore)) ? Number(creditScore) : 82;
  const safeLoyaltyProgress = Number.isFinite(Number(loyaltyProgressRaw)) ? Number(loyaltyProgressRaw) : 0;
  const hasActiveLoan = safeActiveCredit > 0;

  const handleCashOut = () => {
    if (safeWalletBalance <= 0) {
      toast.error(`Insufficient balance in ${walletLabel}`);
      return;
    }
    onWithdrawFunds();
  };

  const [showDisciplineDetails, setShowDisciplineDetails] = useState(false);
  const [showCreditScoreBreakdown, setShowCreditScoreBreakdown] = useState(false);
  const tabs = currencyTabs && currencyTabs.length > 0
    ? currencyTabs
    : [{ currencyCode: 'USD', displayName: 'USD', symbol: '$' }, { currencyCode: 'ZIG', displayName: 'ZiG', symbol: 'ZiG' }, { currencyCode: 'ZAR', displayName: 'ZAR', symbol: 'R' }];
  /** Radix Select throws if `value` is not present in items — coerce to a valid tab. */
  const selectCurrency: CurrencyOption = tabs.some((t) => t.currencyCode === selectedCurrency)
    ? (selectedCurrency as CurrencyOption)
    : ((tabs[0]?.currencyCode as CurrencyOption) ?? "USD");

  useLayoutEffect(() => {
    if (!onCurrencyChange) return;
    if (selectCurrency !== selectedCurrency) {
      onCurrencyChange(selectCurrency);
    }
  }, [onCurrencyChange, selectCurrency, selectedCurrency]);

  const selectedTab = tabs.find((t) => t.currencyCode === selectCurrency);
  const symbol = selectedTab?.symbol ?? DEFAULT_CURRENCY_SYMBOLS[selectCurrency] ?? "$";
  // Strict currency isolation: ledger shows ONLY transactions for selected currency (scalable)
  const targetCurrency = (selectCurrency ?? "USD").toUpperCase();
  const ledgerTxns = (transactions ?? []).filter((t: { currency?: string }) =>
    (t.currency ?? 'USD').toUpperCase() === targetCurrency
  );
  const custodyLabel = selectedTab?.custodyType === 'blockchain' ? 'Blockchain custody' : selectedTab?.custodyType === 'momo' ? 'Mobile money' : selectedTab?.custodyType ? 'Bank custody' : '';

  const disciplineRingColor = getDisciplineScoreRingColor(safeDisciplineScore);
  const activeTrustBandIdx = trustScoreBandIndex(safeDisciplineScore);
  const creditTier = getCreditScoreTier(safeCreditScore);
  const sfisTier = getSFISEligibilityTier(safeCreditScore);

  // Calculate circular progress for discipline score
  const circumference = 2 * Math.PI * 70; // radius = 70
  const strokeDashoffset = circumference - (safeDisciplineScore / 100) * circumference;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Top ribbon — same canvas as splash (intense green bottom-right → soft top-left). */}
      <div
        className={`relative overflow-hidden rounded-2xl border border-white/25 p-6 sm:p-8 ${onDisciplineGradientShellShadow} ${onDisciplineGradientText}`}
      >
        <div className="finera-gradient-plate finera-gradient-plate--ribbon pointer-events-none" aria-hidden />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl">
              Welcome, {userName}
            </h1>
            <p className="mt-1 text-sm font-medium text-black">
              Empowering your financial literacy journey.
            </p>
            {displayAccountNumber ? (
              <p className={`mt-2 text-xs font-medium ${onDisciplineGradientMuted}`}>
                {/^\d{10}$/.test(String(displayAccountNumber).replace(/\s/g, ""))
                  ? `Wallet ID · ${displayAccountNumber}`
                  : `Account · ${displayAccountNumber}`}
              </p>
            ) : null}
          </div>

          {onCurrencyChange ? (
            <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:min-w-[min(100%,280px)] sm:items-end">
              <span
                id="dash-ribbon-currency-label"
                className={`text-[10px] font-semibold uppercase tracking-widest ${onDisciplineGradientMuted} sm:text-right`}
              >
                Currency
              </span>
              <Select value={selectCurrency} onValueChange={(v) => onCurrencyChange(v as CurrencyOption)}>
                <SelectTrigger
                  aria-labelledby="dash-ribbon-currency-label"
                  className={`h-10 border font-semibold text-sm shadow-none sm:min-w-[220px] ${onDisciplineGradientGlass} ${onDisciplineGradientText}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Coins className={`h-4 w-4 shrink-0 ${onDisciplineGradientIcon}`} aria-hidden />
                    <SelectValue placeholder="Select currency" />
                  </div>
                </SelectTrigger>
                <SelectContent align="end">
                  {tabs.map((tab) => (
                    <SelectItem key={tab.currencyCode} value={tab.currencyCode}>
                      {tab.currencyCode} - {tab.displayName} ({tab.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </div>

      {/* Primary row: potential credit (left) | wallet + active loan stacked (right), equal small frames matching left column height */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch">
        <motion.div whileHover={{ y: -4 }} className="order-1 flex min-h-0">
          <Card
            className={`relative flex h-full min-h-[22rem] w-full flex-col overflow-hidden rounded-[28px] border-none p-6 ${onDisciplineGradientShellShadow} ${onDisciplineGradientText}`}
          >
            <div className="finera-gradient-plate finera-gradient-plate--card pointer-events-none" aria-hidden />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              <div className="mb-4 flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border p-0 ${onDisciplineGradientGlass}`}>
                  <CreditCard className={`h-6 w-6 ${onDisciplineGradientIcon}`} aria-hidden />
                </div>
                <div className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${onDisciplineGradientPill}`}>
                  Ready
                </div>
              </div>
              <p className={`text-xs font-semibold uppercase tracking-widest ${onDisciplineGradientText}`}>Potential credit</p>
              <p className={`mt-1 text-[11px] font-semibold uppercase tracking-wider ${onDisciplineGradientMuted}`}>
                {selectCurrency} limit
              </p>
              <h3 className={`mt-0.5 text-4xl leading-none ${finAmountHero} ${onDisciplineGradientText}`}>
                {formatAmountWithCurrency(safeAvailableCreditLimit, selectCurrency)}
              </h3>
              <div className="mt-6 min-h-0 flex-1">
                <LoanTypeSelector accountType={accountType} onSelectLoanType={onSelectLoanType} />
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="order-2 grid min-h-[22rem] grid-rows-2 gap-6 md:flex md:h-full md:min-h-0 md:flex-col">
          <motion.div whileHover={{ y: -4 }} className="flex min-h-0 md:flex-1 md:basis-0">
            <Card
              className={`relative flex h-full min-h-0 w-full flex-col justify-between overflow-hidden rounded-[28px] border-none p-5 sm:p-6 ${onDisciplineGradientShellShadow} ${onDisciplineGradientText}`}
            >
              <div className="finera-gradient-plate finera-gradient-plate--card pointer-events-none" aria-hidden />
              <div className="relative z-10 flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 shrink-0">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="shrink-0" role="img" aria-label="FinEra wallet">
                      <FinEraShieldIcon
                        size={48}
                        className="rounded-full ring-1 ring-white/45 shadow-lg"
                      />
                    </div>
                    <div className={`flex items-center gap-1 rounded-full border px-2 py-1 ${onDisciplineGradientGlass}`}>
                      <TrendingUp className={`h-3 w-3 ${onDisciplineGradientIcon}`} />
                      <span className={`text-[10px] font-bold ${onDisciplineGradientText}`}>+12.5%</span>
                    </div>
                  </div>
                  <p className={`text-[10px] font-semibold uppercase tracking-widest sm:text-xs ${onDisciplineGradientText}`}>{walletLabel}</p>
                  <p className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wider sm:text-[11px] ${onDisciplineGradientMuted}`}>
                    {selectCurrency} balance
                  </p>
                  {custodyLabel ? (
                    <p className={`mt-0.5 text-[9px] font-semibold uppercase tracking-wider sm:text-[10px] ${onDisciplineGradientMuted}`}>
                      {custodyLabel}
                    </p>
                  ) : null}
                  <h3 className={`mt-1 text-2xl leading-none sm:text-3xl ${finAmountPrimary} ${onDisciplineGradientText}`}>
                    {formatAmountWithCurrency(safeWalletBalance, selectCurrency)}
                  </h3>
                </div>
                <div className="mt-auto flex shrink-0 gap-2 border-t border-white/20 pt-3">
                  <Button
                    size="sm"
                    type="button"
                    className="h-9 min-h-9 flex-1 rounded-xl bg-white text-xs font-semibold text-primary hover:bg-white/90 sm:h-10 sm:min-h-10"
                    onClick={onAddSavings}
                  >
                    Cash In
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    className={`h-9 min-h-9 flex-1 rounded-xl border text-xs font-semibold sm:h-10 sm:min-h-10 ${onDisciplineGradientButtonOutline} ${onDisciplineGradientText}`}
                    onClick={handleCashOut}
                  >
                    Cash Out
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="flex min-h-0 md:flex-1 md:basis-0">
            <Card
              className={`relative flex h-full min-h-0 w-full flex-col justify-between overflow-hidden rounded-[28px] border-none p-5 sm:p-6 ${onDisciplineGradientShellShadow} ${onDisciplineGradientText}`}
            >
              <div className="finera-gradient-plate finera-gradient-plate--card pointer-events-none" aria-hidden />
              <div className="relative z-10 flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 shrink-0">
                  <div className="mb-3 flex items-start justify-between">
                    <div className={`rounded-2xl border p-2.5 ${onDisciplineGradientGlass}`}>
                      <CreditCard className={`h-5 w-5 sm:h-6 sm:w-6 ${onDisciplineGradientIcon}`} />
                    </div>
                    <div className="flex items-center gap-1 rounded-full border border-red-500/40 bg-red-100/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-800 backdrop-blur-md dark:border-red-400/35 dark:bg-red-950/40 dark:text-zinc-100">
                      <Award className="h-3 w-3" aria-hidden />
                      <span>Debt</span>
                    </div>
                  </div>
                  <p className={`text-[10px] font-semibold uppercase tracking-widest sm:text-xs ${onDisciplineGradientText}`}>Active loan</p>
                  <p className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wider sm:text-[11px] ${onDisciplineGradientMuted}`}>
                    {selectCurrency} outstanding
                  </p>
                  <h3 className={`mt-1 text-2xl leading-none sm:text-3xl ${finAmountPrimary} ${onDisciplineGradientText}`}>
                    {formatAmountWithCurrency(safeActiveCredit, selectCurrency)}
                  </h3>
                </div>
                <div className="relative z-10 mt-auto w-full shrink-0 border-t border-white/20 pt-3">
                  <div className={`mb-1 flex justify-between text-[9px] font-semibold uppercase tracking-widest sm:text-[10px] ${onDisciplineGradientMuted}`}>
                    <span>Repayment cycle</span>
                    <span>Month 2/12</span>
                  </div>
                  <div className={`h-1.5 w-full overflow-hidden rounded-full ${onDisciplineGradientTrack}`}>
                    <div className={`h-full w-[16%] ${onDisciplineGradientTrackFill}`} />
                  </div>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className={`h-8 min-h-8 flex-1 text-[9px] font-semibold uppercase tracking-widest hover:bg-white/18 dark:hover:bg-white/12 sm:h-9 sm:min-h-9 sm:text-[10px] ${onDisciplineGradientText}`}
                      onClick={onViewRepayment}
                    >
                      View Repayment
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!hasActiveLoan || !onMakeRepayment}
                      className="h-8 min-h-8 flex-1 rounded-xl bg-white text-[9px] font-semibold uppercase tracking-widest text-primary hover:bg-white/90 disabled:opacity-50 sm:h-9 sm:min-h-9 sm:text-[10px]"
                      onClick={() => {
                        if (!hasActiveLoan || !onMakeRepayment) return;
                        onMakeRepayment();
                      }}
                    >
                      Repay loan
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      <div>
        <QuickActionsPanel
          onAddSavings={onAddSavings}
          onViewRepayment={onViewRepayment}
          onWithdrawFunds={onWithdrawFunds}
          onMakePayment={onMakePayment}
          onPeerTransfer={onPeerTransfer}
          compact
        />
      </div>

      {/* 5️⃣ Financial Identity — TrustScore */}
      <div>
        <h2 className="mb-4 flex flex-wrap items-center gap-2 text-2xl font-black text-foreground">
          <ShieldCheck className="h-6 w-6 shrink-0 text-primary dark:text-primary" aria-hidden />
          <span>Financial Identity</span>
        </h2>

        <div className="grid grid-cols-1 gap-6">
          <motion.div whileHover={{ y: -4 }}>
            <Card
              className={`relative h-full overflow-hidden rounded-2xl border-none p-6 ${onDisciplineGradientShellShadow} ${onDisciplineGradientText}`}
            >
              <div className="finera-gradient-plate finera-gradient-plate--panel pointer-events-none" aria-hidden />

              <div className="relative z-10">
                <h3 className={`mb-6 text-lg font-semibold tracking-tight ${onDisciplineGradientText}`}>TrustScore</h3>

                {/* Circular Progress Ring */}
                <div className="mb-6 flex items-center justify-center">
                  <div className="relative h-40 w-40">
                    <svg className="h-40 w-40 -rotate-90 transform">
                      <circle
                        className="stroke-zinc-600/18 dark:stroke-zinc-300/22"
                        cx="80"
                        cy="80"
                        r="70"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke={disciplineRingColor}
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`text-center ${onDisciplineGradientText}`}>
                        <div className="text-5xl font-bold tracking-tight tabular-nums">{safeDisciplineScore}</div>
                        <div className={`text-sm font-medium tabular-nums ${onDisciplineGradientMuted}`}>{"/100"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className={`mb-2 text-center text-sm font-medium leading-snug ${onDisciplineGradientMuted}`}>
                  Your repayment discipline and wallet balance consistency rating.
                </p>
                <p className={`mb-4 text-center text-xs leading-relaxed ${onDisciplineGradientMuted}`}>
                  Improves with on-time payments and stable wallet funding.
                </p>

                <Button
                  variant="outline"
                  className={`h-11 w-full rounded-xl border font-semibold backdrop-blur-md ${onDisciplineGradientButtonOutline} ${onDisciplineGradientText}`}
                  onClick={() => setShowDisciplineDetails(!showDisciplineDetails)}
                  aria-expanded={showDisciplineDetails}
                >
                  {showDisciplineDetails ? "Hide colour guide" : "View Details"}
                </Button>

                {showDisciplineDetails && (
                  <div
                    className="mt-4 rounded-xl border border-white/50 bg-white/80 p-4 text-left text-zinc-800 shadow-none backdrop-blur-md ring-1 ring-white/60 dark:border-white/15 dark:bg-white/12 dark:text-zinc-100 dark:ring-white/15"
                    role="region"
                    aria-label="TrustScore colour bands"
                  >
                    <div className="mb-3 flex items-start gap-2">
                      <Info className={`mt-0.5 h-4 w-4 shrink-0 ${onDisciplineGradientText}`} aria-hidden />
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-wide text-zinc-800 dark:text-zinc-100`}>What the colours mean</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                          TrustScore runs from 0–100. The card and ring use the same bands below.
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-2.5">
                      {TRUST_SCORE_BANDS.map((band, idx) => {
                        const isActive = idx === activeTrustBandIdx;
                        return (
                          <li
                            key={`${band.min}-${band.max}`}
                            className={`flex gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                              isActive
                                ? "bg-white/35 ring-1 ring-white/55 dark:bg-white/14 dark:ring-white/25"
                                : "bg-white/[0.14] dark:bg-white/[0.08]"
                            }`}
                          >
                            <span
                              className={`mt-0.5 h-9 w-3 shrink-0 rounded-full ${band.swatchClass}`}
                              title={`${band.short}`}
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{band.label}</span>
                                <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                                  {band.min}–{band.max} · {band.short}
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">{band.description}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <p
                      className="mt-3 border-t border-zinc-200/80 pt-3 text-[11px] font-medium leading-relaxed text-zinc-600 dark:border-white/10 dark:text-zinc-400"
                    >
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">Your score ({safeDisciplineScore}):</span> You are in the{" "}
                      <span className="font-semibold underline decoration-zinc-400/50 underline-offset-2 dark:decoration-zinc-500/50">
                        {TRUST_SCORE_BANDS[activeTrustBandIdx].label}
                      </span>{" "}
                      band ({TRUST_SCORE_BANDS[activeTrustBandIdx].short}).
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* 6️⃣ Analytics & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* C. Loyalty Progress Card™ (10-Cycle Engine) */}
        <motion.div whileHover={{ y: -4 }}>
          <Card
            className={`relative h-full overflow-hidden border-none p-6 shadow-xl shadow-slate-200/50 dark:shadow-none ${
              safeLoyaltyProgress === 10 ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white" : ""
            }`}
          >
            {safeLoyaltyProgress !== 10 ? (
              <div className="finera-gradient-plate finera-gradient-plate--panel pointer-events-none" aria-hidden />
            ) : null}
            <div className="relative z-10">
            <h3 className={`mb-6 text-lg font-black ${safeLoyaltyProgress === 10 ? "text-white" : "text-foreground"}`}>
              Loyalty Reward Progress
            </h3>
            
            {/* Horizontal Tracker */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cycle) => (
                  <div key={cycle} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                      cycle <= safeLoyaltyProgress 
                        ? (safeLoyaltyProgress === 10 ? 'bg-white text-amber-600' : 'bg-primary text-white') 
                        : 'bg-slate-200 text-muted-foreground dark:bg-slate-700 dark:text-white/85'
                    }`}>
                      {cycle <= safeLoyaltyProgress ? '✓' : cycle}
                    </div>
                    <div className={`text-[8px] mt-1 font-bold ${safeLoyaltyProgress === 10 ? 'text-white' : 'text-muted-foreground/75'}`}>
                      {cycle}
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${safeLoyaltyProgress === 10 ? 'bg-white' : 'bg-primary'} transition-all duration-500`}
                  style={{ width: `${(safeLoyaltyProgress / 10) * 100}%` }}
                />
              </div>
            </div>

            <p className={`text-sm mb-4 font-medium ${safeLoyaltyProgress === 10 ? 'text-white' : 'text-muted-foreground'}`}>
              {safeLoyaltyProgress === 10 
                ? "12% Interest Discount Activated On Next Loan." 
                : "Complete 10 loans with zero repayment default to unlock one-time complete interest discount"}
            </p>

            {safeLoyaltyProgress === 9 && (
              <div className="px-4 py-3 bg-amber-50 border-2 border-amber-400 rounded-xl mb-4 dark:bg-amber-950/60 dark:border-amber-600">
                <p className="text-amber-900 dark:text-amber-100 font-black text-sm text-center">
                  🎉 1 Loan Away From 12% Discount!
                </p>
              </div>
            )}

            {safeLoyaltyProgress === 10 && (
              <div className="px-4 py-3 bg-white/20 backdrop-blur-md border-2 border-white/40 rounded-xl">
                <p className="text-white font-black text-sm text-center">
                  🏆 Congratulations! Loyalty Milestone Achieved!
                </p>
              </div>
            )}

            {safeLoyaltyProgress < 9 && (
              <div className="text-center">
                <p className={`text-xs font-bold ${safeLoyaltyProgress === 10 ? 'text-white/80' : 'text-muted-foreground/85'}`}>
                  {10 - safeLoyaltyProgress} more successful {10 - safeLoyaltyProgress === 1 ? 'cycle' : 'cycles'} to go
                </p>
              </div>
            )}
            </div>
          </Card>
        </motion.div>

        {/* Recent Transactions - currency-scoped ledger */}
        <Card className="relative flex flex-col overflow-hidden border-none p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <div className="finera-gradient-plate finera-gradient-plate--panel pointer-events-none" aria-hidden />
          <div className="relative z-10 flex flex-1 flex-col">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-black text-foreground">Ledger Activity ({selectCurrency})</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary font-black uppercase text-[10px] tracking-widest dark:text-primary"
              onClick={() => exportLedgerToCsv(ledgerTxns, symbol, selectCurrency)}
            >
              Export Logs
            </Button>
          </div>
          <div className="space-y-4 flex-1">
            {ledgerTxns.length > 0 ? ledgerTxns.slice(-4).reverse().map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-200 dark:bg-slate-800/70 dark:hover:border-slate-600 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl group-hover:scale-110 transition-transform ${
                    txn.type === 'deposit' ? 'bg-primary-light text-primary dark:bg-primary/20 dark:text-primary' : 
                    txn.type === 'withdrawal' || txn.type === 'transfer' ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400' : 'bg-primary-light text-primary dark:bg-primary/20 dark:text-primary'
                  }`}>
                    {txn.type === 'deposit' ? <ArrowUpRight className="w-5 h-5" /> : 
                     txn.type === 'withdrawal' ? <ArrowDownLeft className="w-5 h-5" /> : 
                     txn.type === 'transfer' ? <Send className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground">{txn.description}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{new Date(txn.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      txn.type === "deposit"
                        ? `text-emerald-600 dark:text-emerald-400 ${finAmountLedger}`
                        : txn.type === "withdrawal" || txn.type === "transfer"
                          ? `text-red-600 dark:text-red-400 ${finAmountLedger}`
                          : `text-foreground ${finAmountLedger}`
                    }`}
                  >
                    {txn.type === "deposit" ? "+" : "-"}
                    {formatAmountWithSymbol(symbol, txn.amount)}
                  </p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
                  <Info className="w-8 h-8 text-muted-foreground/70" />
                </div>
                <p className="text-muted-foreground/90 font-medium">No {selectCurrency} ledger activity yet. Use Cash In to add funds and see transactions.</p>
                {onMakePayment ? (
                  <Button variant="link" onClick={onMakePayment} className="text-primary dark:text-primary font-bold">Make Payment</Button>
                ) : (
                  <Button variant="link" onClick={onAddSavings} className="text-primary dark:text-primary font-bold">Start with Cash In</Button>
                )}
              </div>
            )}
          </div>
          </div>
        </Card>
      </div>
    </div>
  );
}