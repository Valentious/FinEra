import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { 
  Wallet,
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar,
  Info,
  ShieldCheck,
  Zap,
  Award,
  ChevronRight,
  Coins
} from "lucide-react";
import { PerformancePortfolioChart } from "@/app/components/PerformancePortfolioChart";
import { motion } from "motion/react";
import { toast } from "sonner";

export type CurrencyOption = 'USD' | 'ZIG' | 'ZAR' | 'EUR' | 'GBP' | 'USDT';

const DEFAULT_CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  ZIG: 'Z$',
  ZAR: 'R',
  USDT: '₮',
  EUR: '€',
  GBP: '£',
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
        `${new Date(t.date).toLocaleDateString()},"${t.type}","${(t.description || "").replace(/"/g, '""')}",${t.type === "deposit" ? "+" : "-"}${symbol}${t.amount.toLocaleString()},"${currencyCode}"`
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
  savingsBalance: number;
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
  onViewSavings: () => void;
  onViewRepayment: () => void;
  onWithdrawFunds: () => void;
  onMakePayment?: () => void;
  transactions: any[];
  /** Dynamic currency dashboards from API - renders tabs from this list */
  currencyTabs?: CurrencyTab[];
  /** Currency-specific rules (from dashboard_config) */
  dashboardConfig?: Record<string, unknown>;
}

// Helper function to get discipline score color
function getDisciplineScoreColor(score: number): string {
  if (score >= 80) return "from-emerald-500 to-emerald-600";
  if (score >= 65) return "from-emerald-500 to-emerald-600";
  if (score >= 50) return "from-amber-500 to-amber-600";
  return "from-red-400 to-red-500";
}

function getDisciplineScoreRingColor(score: number): string {
  if (score >= 80) return "#10b981"; // emerald-500
  if (score >= 65) return "#22C55E"; // emerald-500
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
    description: "Requires savings improvement"
  };
}

export function DashboardV2({
  userName,
  savingsBalance,
  activeCredit,
  availableCreditLimit,
  disciplineScore,
  creditScore,
  loyaltyProgress,
  selectedCurrency = 'USD',
  onCurrencyChange,
  displayAccountNumber,
  onApplyForCredit,
  onAddSavings,
  onViewSavings,
  onViewRepayment,
  onWithdrawFunds,
  onMakePayment,
  transactions,
  currencyTabs,
  dashboardConfig = {},
}: DashboardV2Props) {
  const [showDisciplineDetails, setShowDisciplineDetails] = useState(false);
  const [showCreditScoreBreakdown, setShowCreditScoreBreakdown] = useState(false);
  const tabs = currencyTabs && currencyTabs.length > 0
    ? currencyTabs
    : [{ currencyCode: 'USD', displayName: 'USD', symbol: '$' }, { currencyCode: 'ZIG', displayName: 'ZiG', symbol: 'Z$' }, { currencyCode: 'ZAR', displayName: 'ZAR', symbol: 'R' }];
  const selectedTab = tabs.find((t) => t.currencyCode === selectedCurrency);
  const symbol = selectedTab?.symbol ?? DEFAULT_CURRENCY_SYMBOLS[selectedCurrency] ?? '$';
  // Strict currency isolation: ledger shows ONLY transactions for selected currency (scalable)
  const targetCurrency = (selectedCurrency ?? 'USD').toUpperCase();
  const ledgerTxns = (transactions ?? []).filter((t: { currency?: string }) =>
    (t.currency ?? 'USD').toUpperCase() === targetCurrency
  );
  const custodyLabel = selectedTab?.custodyType === 'blockchain' ? 'Blockchain custody' : selectedTab?.custodyType === 'momo' ? 'Mobile money' : selectedTab?.custodyType ? 'Bank custody' : '';

  const disciplineColor = getDisciplineScoreColor(disciplineScore);
  const disciplineRingColor = getDisciplineScoreRingColor(disciplineScore);
  const creditTier = getCreditScoreTier(creditScore);
  const sfisTier = getSFISEligibilityTier(creditScore);

  // Calculate circular progress for discipline score
  const circumference = 2 * Math.PI * 70; // radius = 70
  const strokeDashoffset = circumference - (disciplineScore / 100) * circumference;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Dynamic Currency Dashboard Selector - Each currency = independent dashboard */}
      {onCurrencyChange && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-600">Dashboard:</span>
          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.currencyCode}
                onClick={() => onCurrencyChange(tab.currencyCode as CurrencyOption)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  selectedCurrency === tab.currencyCode
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.displayName} Dashboard
              </button>
            ))}
          </div>
          {displayAccountNumber && (
            <span className="text-xs text-slate-500 font-medium ml-2">
              Acc: {displayAccountNumber}
            </span>
          )}
          {custodyLabel && (
            <span className="text-xs text-slate-400 ml-2">• {custodyLabel}</span>
          )}
        </div>
      )}

      {/* 1️⃣ Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Hello, {userName} 👋</h1>
          <p className="text-slate-500 font-medium text-sm">Empowering your financial literacy journey.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-bold text-slate-700">Wednesday, Mar 4, 2026</span>
        </div>
      </div>

      {/* 2️⃣ Primary Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1️⃣ Available Credit (Professional Charcoal Black) */}
        <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} className="order-1">
          <Card className="p-6 bg-[#1F2937] text-white border-none shadow-lg hover:bg-[#374151] transition-all duration-300 relative overflow-hidden h-full flex flex-col justify-between cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                  <Zap className="w-6 h-6 text-amber-300" />
                </div>
                <div className="px-2 py-1 bg-green-500/20 text-green-300 text-[10px] font-black rounded-full backdrop-blur-md uppercase tracking-widest border border-green-500/30">
                  Ready to Apply
                </div>
              </div>
              <p className="text-gray-300 text-xs font-black uppercase tracking-widest">Potential Credit Limit</p>
              <h3 className="text-4xl font-black mt-1">{selectedCurrency} {symbol}{availableCreditLimit.toLocaleString()}</h3>
              <p className="text-gray-400 text-xs mt-2 font-medium">Increase TrustScore, Unlock More Credit</p>
            </div>
            <div className="relative z-10 mt-8">
              <Button 
                onClick={onApplyForCredit}
                className="w-full bg-white text-[#1F2937] hover:bg-gray-100 h-14 rounded-xl font-black text-lg gap-2 shadow-xl active:scale-[0.98] transition-all"
              >
                Apply for Credit <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* 2️⃣ Savings Balance */}
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
              <p className="text-emerald-100 text-xs font-black uppercase tracking-widest">Savings Balance</p>
              <h3 className="text-3xl font-black mt-1">{symbol}{savingsBalance.toLocaleString()}</h3>
            </div>
            <div className="mt-6 flex gap-2">
              <Button size="sm" className="bg-white text-emerald-600 hover:bg-emerald-50 font-black flex-1 h-10 rounded-xl" onClick={onAddSavings}>
                Deposit
              </Button>
              <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-white/20 text-white font-black flex-1 h-10 rounded-xl" onClick={onViewSavings}>
                Details
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* 3️⃣ Active Loan */}
        <motion.div whileHover={{ y: -4 }} className="order-3">
          <Card className="p-6 bg-white border-slate-100 shadow-xl shadow-slate-200/50 h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-50 rounded-2xl">
                  <CreditCard className="w-6 h-6 text-red-600" />
                </div>
                <div className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full uppercase">Current Debt</div>
              </div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Active Loan</p>
              <h3 className="text-3xl font-black mt-1 text-slate-900">{symbol}{activeCredit.toLocaleString()}</h3>
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-[10px] font-black mb-1 text-slate-400 uppercase">
                <span>REPAYMENT CYCLE</span>
                <span>MONTH 2/12</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 w-[16%]" />
              </div>
              <Button variant="ghost" className="w-full mt-2 h-8 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-50" onClick={onViewRepayment}>
                View Repayment Plan
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* 4️⃣ YOUR FINANCIAL IDENTITY SECTION */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
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
                        stroke="white"
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
                        <div className="text-5xl font-black">{disciplineScore}</div>
                        <div className="text-sm opacity-90">/100</div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-white/90 text-sm mb-2 font-medium text-center">
                  Your repayment discipline and savings consistency rating.
                </p>
                <p className="text-white/70 text-xs mb-4 text-center">
                  Improves with on-time payments and stable savings.
                </p>

                <Button 
                  variant="outline" 
                  className="w-full bg-white/10 hover:bg-white/20 text-white border-white/30 h-11 rounded-xl font-black backdrop-blur-md"
                  onClick={() => setShowDisciplineDetails(!showDisciplineDetails)}
                >
                  View Details
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* B. Performance Portfolio Chart - Savings Wallet driven */}
          <motion.div whileHover={{ y: -4 }}>
            <Card className="p-6 border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-slate-900">Performance Portfolio ({selectedCurrency})</h3>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                  <ShieldCheck className="w-3 h-3 text-green-500" />
                  Savings Wallet
                </div>
              </div>
              <PerformancePortfolioChart
                transactions={ledgerTxns}
                currentBalance={savingsBalance}
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
          <Card className={`p-6 border-slate-200 shadow-xl shadow-slate-200/50 h-full ${loyaltyProgress === 10 ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white border-none' : ''}`}>
            <h3 className={`text-lg font-black mb-6 ${loyaltyProgress === 10 ? 'text-white' : 'text-slate-900'}`}>
              Loyalty Reward Progress
            </h3>
            
            {/* Horizontal Tracker */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cycle) => (
                  <div key={cycle} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                      cycle <= loyaltyProgress 
                        ? (loyaltyProgress === 10 ? 'bg-white text-amber-600' : 'bg-green-500 text-white') 
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      {cycle <= loyaltyProgress ? '✓' : cycle}
                    </div>
                    <div className={`text-[8px] mt-1 font-bold ${loyaltyProgress === 10 ? 'text-white' : 'text-slate-400'}`}>
                      {cycle}
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${loyaltyProgress === 10 ? 'bg-white' : 'bg-green-500'} transition-all duration-500`}
                  style={{ width: `${(loyaltyProgress / 10) * 100}%` }}
                />
              </div>
            </div>

            <p className={`text-sm mb-4 font-medium ${loyaltyProgress === 10 ? 'text-white' : 'text-slate-600'}`}>
              {loyaltyProgress === 10 
                ? "12% Interest Discount Activated On Next Loan." 
                : "Complete 10 loans with zero repayment default to unlock one-time complete interest discount"}
            </p>

            {loyaltyProgress === 9 && (
              <div className="px-4 py-3 bg-amber-50 border-2 border-amber-400 rounded-xl mb-4">
                <p className="text-amber-900 font-black text-sm text-center">
                  🎉 1 Loan Away From 12% Discount!
                </p>
              </div>
            )}

            {loyaltyProgress === 10 && (
              <div className="px-4 py-3 bg-white/20 backdrop-blur-md border-2 border-white/40 rounded-xl">
                <p className="text-white font-black text-sm text-center">
                  🏆 Congratulations! Loyalty Milestone Achieved!
                </p>
              </div>
            )}

            {loyaltyProgress < 9 && (
              <div className="text-center">
                <p className={`text-xs font-bold ${loyaltyProgress === 10 ? 'text-white/80' : 'text-slate-500'}`}>
                  {10 - loyaltyProgress} more successful {10 - loyaltyProgress === 1 ? 'cycle' : 'cycles'} to go
                </p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Recent Transactions - currency-scoped ledger */}
        <Card className="p-6 border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900">Ledger Activity ({selectedCurrency})</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-600 font-black uppercase text-[10px] tracking-widest"
              onClick={() => exportLedgerToCsv(ledgerTxns, symbol, selectedCurrency ?? 'USD')}
            >
              Export Logs
            </Button>
          </div>
          <div className="space-y-4 flex-1">
            {ledgerTxns.length > 0 ? ledgerTxns.slice(-4).reverse().map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-200 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl group-hover:scale-110 transition-transform ${
                    txn.type === 'deposit' ? 'bg-green-100 text-green-600' : 
                    txn.type === 'withdrawal' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {txn.type === 'deposit' ? <ArrowUpRight className="w-5 h-5" /> : 
                     txn.type === 'withdrawal' ? <ArrowDownLeft className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{txn.description}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{new Date(txn.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${
                    txn.type === 'deposit' ? 'text-green-600' : 
                    txn.type === 'withdrawal' ? 'text-red-600' : 'text-slate-900'
                  }`}>
                    {txn.type === 'deposit' ? '+' : '-'}{symbol}{txn.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="p-4 bg-slate-50 rounded-full mb-4">
                  <Info className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No {selectedCurrency} ledger activity yet. Deposit to this account to see transactions.</p>
                {onMakePayment ? (
                  <Button variant="link" onClick={onMakePayment} className="text-emerald-600 font-bold">Make Payment</Button>
                ) : (
                  <Button variant="link" onClick={onAddSavings} className="text-emerald-600 font-bold">Initiate first deposit</Button>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}