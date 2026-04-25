import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { 
  PiggyBank, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet,
  Calendar,
  ChevronRight,
  Info,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { formatAmountWithCurrency, getWalletLabel } from "@/types/wallet";
import {
  getDisciplineScoreGradientClasses,
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
import { finAmountHero, finAmountLedger, finAmountPrimary } from "@/lib/financialTypography";

interface DashboardProps {
  userName: string;
  /** Primary balance for active currency wallet */
  walletBalance: number;
  /** USD | ZIG | ZAR - drives FinCash … Wallet label */
  dashboardCurrency?: string;
  activeCredit: number;
  availableCreditLimit: number;
  /** Drives FinCash card gradient (same bands as TrustScore) */
  disciplineScore?: number;
  onApplyForCredit: () => void;
  onAddSavings: () => void;
  onWithdrawFunds: () => void;
  onViewRepayment: () => void;
  transactions: any[];
}

export function Dashboard({
  userName,
  walletBalance,
  dashboardCurrency = "USD",
  activeCredit,
  availableCreditLimit,
  disciplineScore = 50,
  onApplyForCredit,
  onAddSavings,
  onWithdrawFunds,
  onViewRepayment,
  transactions
}: DashboardProps) {
  const walletLabel = getWalletLabel(dashboardCurrency);
  const walletGradient = getDisciplineScoreGradientClasses(disciplineScore);
  const cc = dashboardCurrency.toUpperCase();
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header ribbon - same gradient + elevation as TrustScore-style cards */}
      <div
        className={`relative overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-br ${walletGradient} p-6 sm:p-8 ${onDisciplineGradientShellShadow} ${onDisciplineGradientText}`}
      >
        <div className={`pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full blur-3xl ${onDisciplineGradientOrb}`} />
        <div className="pointer-events-none absolute bottom-0 left-0 h-44 w-44 -translate-x-1/4 translate-y-1/4 rounded-full bg-primary/18 blur-3xl dark:bg-primary/12" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-widest ${onDisciplineGradientMuted}`}>FinCash · {cc}</p>
            <h1 className="mt-1 text-[12pt] font-semibold tracking-tight text-black">
              Welcome, {userName}
            </h1>
          </div>
          <div
            className={`flex items-center gap-2 self-start rounded-2xl border px-4 py-2.5 shadow-none backdrop-blur-md md:self-center ${onDisciplineGradientGlass} ${onDisciplineGradientText}`}
          >
            <Calendar className={`h-4 w-4 shrink-0 ${onDisciplineGradientIcon}`} aria-hidden />
            <span className="text-sm font-semibold tabular-nums">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Psychological Prioritization: APPLY FIRST */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PRIMARY ACTION: GET LOAN */}
        <motion.div whileHover={{ y: -4 }} className="md:col-span-1 order-1">
          <Card
            className={`relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] border-none bg-gradient-to-br ${walletGradient} p-6 ${onDisciplineGradientShellShadow} ${onDisciplineGradientText}`}
          >
            <div className={`absolute -right-16 -top-16 h-32 w-32 rounded-full blur-3xl ${onDisciplineGradientOrb}`} />
            <div className="relative z-10">
              <div className="mb-6 flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border p-0 ${onDisciplineGradientGlass}`}>
                  <CreditCard className={`h-6 w-6 ${onDisciplineGradientIcon}`} aria-hidden />
                </div>
                <div className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${onDisciplineGradientPill}`}>
                  Ready for loan
                </div>
              </div>
              <p className={`text-xs font-semibold uppercase tracking-widest ${onDisciplineGradientText}`}>Available Credit</p>
              <p className={`mt-1 text-[11px] font-semibold uppercase tracking-wider ${onDisciplineGradientMuted}`}>{cc} limit</p>
              <h3 className={`mt-0.5 text-4xl leading-none ${finAmountHero} ${onDisciplineGradientText}`}>
                {formatAmountWithCurrency(availableCreditLimit, cc)}
              </h3>
            </div>
            <div className="relative z-10 mt-8">
              <Button 
                onClick={onApplyForCredit}
                className="w-full bg-primary text-white hover:bg-primary-hover h-14 rounded-2xl font-black text-lg gap-2 shadow-[0_20px_50px_rgba(37,211,102,0.18)] active:scale-[0.98] transition-all"
              >
                GET LOAN <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* FinCash wallet (currency-scoped) - TrustScore-style gradient */}
        <motion.div whileHover={{ y: -4 }} className="order-2">
          <Card
            className={`relative flex h-full flex-col justify-between overflow-hidden border-none bg-gradient-to-br ${walletGradient} p-6 ${onDisciplineGradientShellShadow} ${onDisciplineGradientText}`}
          >
            <div className={`absolute -right-16 -top-16 h-32 w-32 rounded-full blur-3xl ${onDisciplineGradientOrb}`} />
            <div className="relative z-10 flex flex-1 flex-col justify-between">
              <div>
                <div className="mb-4">
                  <div className={`inline-flex rounded-2xl border p-3 ${onDisciplineGradientGlass}`}>
                    <Wallet className={`h-6 w-6 ${onDisciplineGradientIcon}`} />
                  </div>
                </div>
                <p className={`text-xs font-semibold uppercase tracking-widest ${onDisciplineGradientText}`}>{walletLabel}</p>
                <p className={`mt-1 text-[11px] font-semibold uppercase tracking-wider ${onDisciplineGradientMuted}`}>{cc} balance</p>
                <h3 className={`mt-0.5 text-3xl leading-none ${finAmountPrimary} ${onDisciplineGradientText}`}>
                  {formatAmountWithCurrency(walletBalance, cc)}
                </h3>
              </div>
              <div className="mt-6 flex gap-2">
                <Button size="sm" className="h-10 flex-1 rounded-xl bg-white font-semibold text-primary hover:bg-white/90" onClick={onAddSavings}>
                  Cash In
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-10 flex-1 rounded-xl border font-semibold ${onDisciplineGradientButtonOutline} ${onDisciplineGradientText}`}
                  onClick={onWithdrawFunds}
                >
                  Cash Out
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Outstanding Credit - TrustScore-style gradient */}
        <motion.div whileHover={{ y: -4 }} className="order-3">
          <Card
            className={`relative flex h-full flex-col justify-between overflow-hidden border-none bg-gradient-to-br ${walletGradient} p-6 ${onDisciplineGradientShellShadow} ${onDisciplineGradientText}`}
          >
            <div className={`absolute bottom-0 left-0 h-28 w-28 -translate-x-1/4 translate-y-1/4 rounded-full blur-3xl ${onDisciplineGradientOrb}`} />
            <div className="relative z-10">
              <div className="mb-4 flex items-start justify-between">
                <div className={`rounded-2xl border p-3 ${onDisciplineGradientGlass}`}>
                  <CreditCard className={`h-6 w-6 ${onDisciplineGradientIcon}`} />
                </div>
                <div className="rounded-full border border-red-500/40 bg-red-100/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-800 backdrop-blur-md dark:border-red-400/35 dark:bg-red-950/40 dark:text-zinc-100">
                  Current Debt
                </div>
              </div>
              <p className={`text-xs font-semibold uppercase tracking-widest ${onDisciplineGradientText}`}>Active Credit</p>
              <p className={`mt-1 text-[11px] font-semibold uppercase tracking-wider ${onDisciplineGradientMuted}`}>{cc} outstanding</p>
              <h3 className={`mt-0.5 text-3xl leading-none ${finAmountPrimary} ${onDisciplineGradientText}`}>
                {formatAmountWithCurrency(activeCredit, cc)}
              </h3>
            </div>
            <div className="relative z-10 mt-6">
              <div className={`mb-1 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400`}>
                <span>Repayment cycle</span>
                <span>Month 2/12</span>
              </div>
              <div className={`h-1.5 w-full overflow-hidden rounded-full ${onDisciplineGradientTrack}`}>
                <div className={`h-full w-[16%] ${onDisciplineGradientTrackFill}`} />
              </div>
              <Button
                variant="ghost"
                className={`mt-2 h-8 w-full text-[10px] font-semibold uppercase tracking-widest hover:bg-white/18 dark:hover:bg-white/12 ${onDisciplineGradientText}`}
                onClick={onViewRepayment}
              >
                View Repayment Plan
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Analytics & Activity Row */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Transactions */}
        <Card className="p-6 border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-foreground">Ledger Activity</h3>
            <Button variant="ghost" size="sm" className="text-primary font-black uppercase text-[10px] tracking-widest">Export Logs</Button>
          </div>
          <div className="space-y-4 flex-1">
            {transactions.length > 0 ? transactions.slice(-4).reverse().map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-200 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl group-hover:scale-110 transition-transform ${
                    txn.type === 'deposit' ? 'bg-primary-light text-primary' : 
                    txn.type === 'withdrawal' ? 'bg-red-100 text-red-600' : 'bg-primary-light text-primary'
                  }`}>
                    {txn.type === 'deposit' ? <ArrowUpRight className="w-5 h-5" /> : 
                     txn.type === 'withdrawal' ? <ArrowDownLeft className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
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
                        : txn.type === "withdrawal"
                          ? `text-red-600 dark:text-red-400 ${finAmountLedger}`
                          : `text-foreground ${finAmountLedger}`
                    }`}
                  >
                    {txn.type === "deposit" ? "+" : "-"}
                    {formatAmountWithCurrency(
                      txn.amount,
                      typeof txn.currency === "string" && txn.currency.length > 0 ? txn.currency : cc
                    )}
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Settled</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="p-4 bg-slate-50 rounded-full mb-4">
                  <Info className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No ledger activity found.</p>
                <Button variant="link" onClick={onAddSavings} className="text-primary font-bold">Start with Cash In</Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
