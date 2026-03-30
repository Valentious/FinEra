import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { 
  Wallet,
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Info,
  ShieldCheck,
  Zap,
  Award,
  ChevronRight,
  Coins,
  Send
} from "lucide-react";
import { PerformancePortfolioChart } from "@/app/components/PerformancePortfolioChart";
import { motion } from "motion/react";
import { toast } from "sonner";
import { CURRENCY_AMOUNT_SYMBOLS, formatAmountWithSymbol } from "@/types/wallet";

export type CurrencyOption = 'USD' | 'ZIG' | 'ZAR' | 'EUR' | 'GBP';

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
  onApplyForCredit: () => void;
  onAddSavings: () => void;
  onViewRepayment: () => void;
  onWithdrawFunds: () => void;
  onMakePayment?: () => void;
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
    swatchClass: "bg-emerald-600",
  },
  {
    min: 65,
    max: 79,
    label: "Strong",
    short: "Green",
    description: "Good discipline. Keep funding your wallet and paying on time to move into Excellent.",
    swatchClass: "bg-emerald-500",
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

// Helper function to get discipline score color (card background gradient)
function getDisciplineScoreColor(score: number): string {
  if (score >= 80) return "from-emerald-600 to-emerald-800";
  if (score >= 65) return "from-emerald-500 to-emerald-700";
  if (score >= 50) return "from-amber-500 to-amber-600";
  return "from-red-400 to-red-600";
}

function getDisciplineScoreRingColor(score: number): string {
  if (score >= 80) return "#059669"; // emerald-600
  if (score >= 65) return "#10b981"; // emerald-500
  if (score >= 50) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

// Helper function to get credit score tier
function getCreditScoreTier(score: number): { tier: string; color: string; bgColor: string } {
  if (score >= 85) return { tier: "Elite", color: "text-purple-600", bgColor: "bg-purple-100" };
  if (score >= 70) return { tier: "Growth", color: "text-emerald-600", bgColor: "bg-emerald-100" };
  if (score >= 50) return { tier: "Standard", color: "text-green-600", bgColor: "bg-green-100" };
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
    color: "text-emerald-600", 
    bgColor: "bg-emerald-100",
    description: "Strong eligibility & competitive terms"
  };
  if (score >= 50) return { 
    tier: "Fair", 
    color: "text-green-600", 
    bgColor: "bg-green-100",
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
  onApplyForCredit,
  onAddSavings,
  onViewRepayment,
  onWithdrawFunds,
  onMakePayment,
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

  const [showDisciplineDetails, setShowDisciplineDetails] = useState(false);
  const [showCreditScoreBreakdown, setShowCreditScoreBreakdown] = useState(false);
  const tabs = currencyTabs && currencyTabs.length > 0
    ? currencyTabs
    : [{ currencyCode: 'USD', displayName: 'USD', symbol: '$' }, { currencyCode: 'ZIG', displayName: 'ZiG', symbol: 'ZiG' }, { currencyCode: 'ZAR', displayName: 'ZAR', symbol: 'R' }];
  const selectedTab = tabs.find((t) => t.currencyCode === selectedCurrency);
  const symbol = selectedTab?.symbol ?? DEFAULT_CURRENCY_SYMBOLS[selectedCurrency] ?? '$';
  // Strict currency isolation: ledger shows ONLY transactions for selected currency (scalable)
  const targetCurrency = (selectedCurrency ?? 'USD').toUpperCase();
  const ledgerTxns = (transactions ?? []).filter((t: { currency?: string }) =>
    (t.currency ?? 'USD').toUpperCase() === targetCurrency
  );
  const custodyLabel = selectedTab?.custodyType === 'blockchain' ? 'Blockchain custody' : selectedTab?.custodyType === 'momo' ? 'Mobile money' : selectedTab?.custodyType ? 'Bank custody' : '';

  const disciplineColor = getDisciplineScoreColor(safeDisciplineScore);
  const disciplineRingColor = getDisciplineScoreRingColor(safeDisciplineScore);
  const activeTrustBandIdx = trustScoreBandIndex(safeDisciplineScore);
  const creditTier = getCreditScoreTier(safeCreditScore);
  const sfisTier = getSFISEligibilityTier(safeCreditScore);

  // Calculate circular progress for discipline score
  const circumference = 2 * Math.PI * 70; // radius = 70
  const strokeDashoffset = circumference - (safeDisciplineScore / 100) * circumference;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Greeting + dashboard currency - same row (global pattern: locale/currency next to identity) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Welcome, {userName}</h1>
          <p className="mt-0.5 text-sm font-medium text-slate-500 dark:text-white/90">
            Empowering your financial literacy journey.
          </p>
          {displayAccountNumber ? (
            <p className="mt-2 text-xs font-medium text-slate-400 dark:text-white/85">
              {/^\d{10}$/.test(String(displayAccountNumber).replace(/\s/g, ""))
                ? `Wallet ID · ${displayAccountNumber}`
                : `Account · ${displayAccountNumber}`}
            </p>
          ) : null}
        </div>

        {onCurrencyChange ? (
          <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:min-w-[min(100%,280px)] sm:items-end">
            <span
              id="dashboard-currency-label"
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/80 sm:text-right"
            >
              CHANGE Dashboard currency
            </span>
            <Select
              value={selectedCurrency}
              onValueChange={(v) => onCurrencyChange(v as CurrencyOption)}
            >
              <SelectTrigger
                aria-labelledby="dashboard-currency-label"
                className="h-11 w-full border-emerald-200 bg-white font-bold text-slate-900 shadow-sm hover:bg-emerald-50/90 focus:ring-emerald-500/25 dark:border-emerald-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 sm:min-w-[260px]"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Coins className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  <SelectValue placeholder="Select currency" />
                </div>
              </SelectTrigger>
              <SelectContent align="end" className="border-emerald-100">
                {tabs.map((tab) => (
                  <SelectItem key={tab.currencyCode} value={tab.currencyCode}>
                    {tab.currencyCode} - {tab.displayName} ({tab.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {custodyLabel ? (
              <p className="text-[10px] font-medium text-slate-400 dark:text-white/75 sm:text-right">{custodyLabel}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* 2️⃣ Primary Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1️⃣ Potential Credit — Telegram-style light grey panel */}
        <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} className="order-1">
          <Card className="p-6 bg-[#e8e8e8] dark:bg-[#2f2f2f] text-slate-900 dark:text-white border border-slate-300/80 dark:border-slate-600 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden h-full flex flex-col justify-between cursor-pointer">
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/40 dark:bg-white/5 blur-2xl rounded-full -mr-10 -mt-10" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-white/70 dark:bg-white/10 rounded-2xl border border-slate-200/80 dark:border-slate-600">
                  <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="px-2 py-1 bg-emerald-600/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-black rounded-full uppercase tracking-widest border border-emerald-600/25 dark:border-emerald-500/30">
                  Ready to Apply
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest">Potential Credit Limit</p>
              <h3 className="text-4xl font-black mt-1 text-slate-900 dark:text-white">{selectedCurrency} {symbol}{safeAvailableCreditLimit.toLocaleString()}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-2 font-medium">Increase TrustScore, Unlock More Credit</p>
            </div>
            <div className="relative z-10 mt-8">
              <Button 
                onClick={onApplyForCredit}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 h-14 rounded-xl font-black text-lg gap-2 shadow-md shadow-emerald-600/25 active:scale-[0.98] transition-all"
              >
                Apply for Credit <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* 2️⃣ FinCash wallet (currency-scoped) */}
        <motion.div whileHover={{ y: -4 }} className="order-2">
          <Card className="p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-none shadow-xl shadow-emerald-100 h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full backdrop-blur-md">
                  <TrendingUp className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-bold">+12.5%</span>
                </div>
              </div>
              <p className="text-emerald-100 text-xs font-black uppercase tracking-widest">{walletLabel}</p>
              <h3 className="text-3xl font-black mt-1">{symbol}{safeWalletBalance.toLocaleString()}</h3>
            </div>
            <div className="mt-6 flex gap-2">
              <Button size="sm" className="bg-white text-emerald-600 hover:bg-emerald-50 font-black flex-1 h-10 rounded-xl" onClick={onAddSavings}>
                Cash In
              </Button>
              <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-white/20 text-white font-black flex-1 h-10 rounded-xl" onClick={onWithdrawFunds}>
                Cash Out
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* 3️⃣ Active Loan */}
        <motion.div whileHover={{ y: -4 }} className="order-3">
          <Card className="p-6 bg-white border-slate-100 shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:border-slate-800 dark:shadow-none h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-50 rounded-2xl dark:bg-red-950/50">
                  <CreditCard className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full uppercase dark:bg-red-950/50 dark:text-red-300">Current Debt</div>
              </div>
              <p className="text-slate-400 dark:text-white/80 text-xs font-black uppercase tracking-widest">Active Loan</p>
              <h3 className="text-3xl font-black mt-1 text-slate-900 dark:text-white">{symbol}{safeActiveCredit.toLocaleString()}</h3>
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-[10px] font-black mb-1 text-slate-400 dark:text-white/75 uppercase">
                <span>REPAYMENT CYCLE</span>
                <span>MONTH 2/12</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 w-[16%]" />
              </div>
              <Button variant="ghost" className="w-full mt-2 h-8 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40" onClick={onViewRepayment}>
                View Repayment Plan
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* 4️⃣ YOUR FINANCIAL IDENTITY SECTION */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          Your Financial Identity
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* A. TrustScore */}
          <motion.div whileHover={{ y: -4 }}>
            <Card className={`p-6 bg-gradient-to-br ${disciplineColor} text-white border-none shadow-2xl relative overflow-hidden h-full`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16" />
              
              <div className="relative z-10">
                <h3 className="text-lg font-black mb-6">TrustScore</h3>
                
                {/* Circular Progress Ring */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-40 h-40">
                    <svg className="transform -rotate-90 w-40 h-40">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="rgba(255,255,255,0.2)"
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
                      <div className="text-center">
                        <div className="text-5xl font-black">{safeDisciplineScore}</div>
                        <div className="text-sm opacity-90">/100</div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-white/90 text-sm mb-2 font-medium text-center">
                  Your repayment discipline and wallet balance consistency rating.
                </p>
                <p className="text-white/70 text-xs mb-4 text-center">
                  Improves with on-time payments and stable wallet funding.
                </p>

                <Button 
                  variant="outline" 
                  className="w-full bg-white/10 hover:bg-white/20 text-white border-white/30 h-11 rounded-xl font-black backdrop-blur-md"
                  onClick={() => setShowDisciplineDetails(!showDisciplineDetails)}
                  aria-expanded={showDisciplineDetails}
                >
                  {showDisciplineDetails ? "Hide colour guide" : "View Details"}
                </Button>

                {showDisciplineDetails && (
                  <div
                    className="mt-4 rounded-xl border border-white/25 bg-black/25 p-4 text-left shadow-inner backdrop-blur-md"
                    role="region"
                    aria-label="TrustScore colour bands"
                  >
                    <div className="flex items-start gap-2 mb-3">
                      <Info className="w-4 h-4 text-white/90 shrink-0 mt-0.5" aria-hidden />
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-white/95">What the colours mean</p>
                        <p className="text-[11px] text-white/75 mt-1 leading-relaxed">
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
                            className={`rounded-lg px-3 py-2.5 flex gap-3 transition-colors ${
                              isActive ? "bg-white/20 ring-1 ring-white/40" : "bg-white/5"
                            }`}
                          >
                            <span
                              className={`mt-0.5 h-9 w-3 shrink-0 rounded-full ${band.swatchClass}`}
                              title={`${band.short}`}
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                                <span className="text-sm font-black text-white">{band.label}</span>
                                <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                                  {band.min}–{band.max} · {band.short}
                                </span>
                              </div>
                              <p className="text-[11px] text-white/80 leading-snug mt-1">{band.description}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-3 pt-3 border-t border-white/15 text-[11px] text-white/90 font-medium leading-relaxed">
                      <span className="font-black text-white">Your score ({safeDisciplineScore}):</span>{" "}
                      You are in the{" "}
                      <span className="font-black underline decoration-white/40 underline-offset-2">
                        {TRUST_SCORE_BANDS[activeTrustBandIdx].label}
                      </span>{" "}
                      band ({TRUST_SCORE_BANDS[activeTrustBandIdx].short}).
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* B. Performance Portfolio Chart - ledger for active currency wallet */}
          <motion.div whileHover={{ y: -4 }}>
            <Card className="p-6 border-slate-100 shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:border-slate-800 dark:shadow-none overflow-hidden h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Performance Portfolio ({selectedCurrency})</h3>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-white/80 uppercase">
                  <ShieldCheck className="w-3 h-3 text-green-500 dark:text-emerald-400" />
                  {walletLabel}
                </div>
              </div>
              <PerformancePortfolioChart
                transactions={ledgerTxns}
                currentBalance={safeWalletBalance}
                currencySymbol={symbol}
              />
            </Card>
          </motion.div>
        </div>
      </div>

      {/* 5️⃣ Analytics & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* C. Loyalty Progress Card™ (10-Cycle Engine) */}
        <motion.div whileHover={{ y: -4 }}>
          <Card className={`p-6 border-slate-200 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:shadow-none h-full ${safeLoyaltyProgress === 10 ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white border-none' : 'dark:bg-slate-900'}`}>
            <h3 className={`text-lg font-black mb-6 ${safeLoyaltyProgress === 10 ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
              Loyalty Reward Progress
            </h3>
            
            {/* Horizontal Tracker */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cycle) => (
                  <div key={cycle} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                      cycle <= safeLoyaltyProgress 
                        ? (safeLoyaltyProgress === 10 ? 'bg-white text-amber-600' : 'bg-green-500 text-white') 
                        : 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-white/85'
                    }`}>
                      {cycle <= safeLoyaltyProgress ? '✓' : cycle}
                    </div>
                    <div className={`text-[8px] mt-1 font-bold ${safeLoyaltyProgress === 10 ? 'text-white' : 'text-slate-400 dark:text-white/75'}`}>
                      {cycle}
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${safeLoyaltyProgress === 10 ? 'bg-white' : 'bg-green-500'} transition-all duration-500`}
                  style={{ width: `${(safeLoyaltyProgress / 10) * 100}%` }}
                />
              </div>
            </div>

            <p className={`text-sm mb-4 font-medium ${safeLoyaltyProgress === 10 ? 'text-white' : 'text-slate-600 dark:text-white/90'}`}>
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
                <p className={`text-xs font-bold ${safeLoyaltyProgress === 10 ? 'text-white/80' : 'text-slate-500 dark:text-white/85'}`}>
                  {10 - safeLoyaltyProgress} more successful {10 - safeLoyaltyProgress === 1 ? 'cycle' : 'cycles'} to go
                </p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Recent Transactions - currency-scoped ledger */}
        <Card className="p-6 border-slate-100 shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:border-slate-800 dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Ledger Activity ({selectedCurrency})</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-600 font-black uppercase text-[10px] tracking-widest dark:text-emerald-400"
              onClick={() => exportLedgerToCsv(ledgerTxns, symbol, selectedCurrency ?? 'USD')}
            >
              Export Logs
            </Button>
          </div>
          <div className="space-y-4 flex-1">
            {ledgerTxns.length > 0 ? ledgerTxns.slice(-4).reverse().map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-200 dark:bg-slate-800/70 dark:hover:border-slate-600 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl group-hover:scale-110 transition-transform ${
                    txn.type === 'deposit' ? 'bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400' : 
                    txn.type === 'withdrawal' || txn.type === 'transfer' ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                  }`}>
                    {txn.type === 'deposit' ? <ArrowUpRight className="w-5 h-5" /> : 
                     txn.type === 'withdrawal' ? <ArrowDownLeft className="w-5 h-5" /> : 
                     txn.type === 'transfer' ? <Send className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{txn.description}</p>
                    <p className="text-[10px] text-slate-500 dark:text-white/75 font-bold uppercase tracking-tight">{new Date(txn.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${
                    txn.type === 'deposit' ? 'text-green-600 dark:text-green-400' : 
                    txn.type === 'withdrawal' || txn.type === 'transfer' ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
                  }`}>
                    {txn.type === "deposit" ? "+" : "-"}
                    {formatAmountWithSymbol(symbol, txn.amount)}
                  </p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
                  <Info className="w-8 h-8 text-slate-300 dark:text-white/70" />
                </div>
                <p className="text-slate-500 dark:text-white/90 font-medium">No {selectedCurrency} ledger activity yet. Use Cash In to add funds and see transactions.</p>
                {onMakePayment ? (
                  <Button variant="link" onClick={onMakePayment} className="text-emerald-600 dark:text-emerald-400 font-bold">Make Payment</Button>
                ) : (
                  <Button variant="link" onClick={onAddSavings} className="text-emerald-600 dark:text-emerald-400 font-bold">Start with Cash In</Button>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}