import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { 
  PiggyBank, 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet,
  Calendar,
  ChevronRight,
  Info,
  ShieldCheck,
  Zap,
  ArrowRight
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { motion } from "framer-motion";
import { getWalletLabel } from "@/types/wallet";

interface DashboardProps {
  userName: string;
  /** Primary balance for active currency wallet */
  walletBalance: number;
  /** USD | ZIG | ZAR - drives FinCash … Wallet label */
  dashboardCurrency?: string;
  activeCredit: number;
  availableCreditLimit: number;
  onApplyForCredit: () => void;
  onAddSavings: () => void;
  onWithdrawFunds: () => void;
  onViewRepayment: () => void;
  transactions: any[];
}

const savingsData = [
  { month: "Jan", balance: 1200 },
  { month: "Feb", balance: 1900 },
  { month: "Mar", balance: 1700 },
  { month: "Apr", balance: 2400 },
  { month: "May", balance: 3100 },
  { month: "Jun", balance: 3800 },
];

export function Dashboard({
  userName,
  walletBalance,
  dashboardCurrency = "USD",
  activeCredit,
  availableCreditLimit,
  onApplyForCredit,
  onAddSavings,
  onWithdrawFunds,
  onViewRepayment,
  transactions
}: DashboardProps) {
  const walletLabel = getWalletLabel(dashboardCurrency);
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Welcome, {userName}</h1>
          <p className="text-slate-500 font-medium text-sm">Empowering your financial literacy journey.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-bold text-slate-700">Sunday, Feb 8, 2026</span>
        </div>
      </div>

      {/* Psychological Prioritization: APPLY FIRST */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PRIMARY ACTION: Apply for Credit */}
        <motion.div whileHover={{ y: -4 }} className="md:col-span-1 order-1">
          <Card className="p-6 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden h-full flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                  <Zap className="w-6 h-6 text-amber-400" />
                </div>
                <div className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-black rounded-full backdrop-blur-md uppercase tracking-widest border border-green-500/30">
                  Ready to Apply
                </div>
              </div>
              <p className="text-emerald-100/60 text-xs font-black uppercase tracking-widest">Available Credit</p>
              <h3 className="text-4xl font-black mt-1">${availableCreditLimit.toLocaleString()}</h3>
            </div>
            <div className="relative z-10 mt-8">
              <Button 
                onClick={onApplyForCredit}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700 h-14 rounded-2xl font-black text-lg gap-2 shadow-xl shadow-emerald-900/30 active:scale-[0.98] transition-all"
              >
                Apply for Credit <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* FinCash wallet (currency-scoped) */}
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
              <h3 className="text-3xl font-black mt-1">${walletBalance.toLocaleString()}</h3>
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

        {/* Outstanding Credit */}
        <motion.div whileHover={{ y: -4 }} className="order-3">
          <Card className="p-6 bg-white border-slate-100 shadow-xl shadow-slate-200/50 h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-50 rounded-2xl">
                  <CreditCard className="w-6 h-6 text-red-600" />
                </div>
                <div className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full uppercase">Current Debt</div>
              </div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Active Credit</p>
              <h3 className="text-3xl font-black mt-1 text-slate-900">${activeCredit.toLocaleString()}</h3>
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

      {/* Analytics & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Savings Growth Chart */}
        <Card className="p-6 border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900">Performance Portfolio</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
              <ShieldCheck className="w-3 h-3 text-green-500" />
              Verified Assets
            </div>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={savingsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: "bold" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: "bold" }} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)", padding: "12px" }}
                  labelStyle={{ fontWeight: "black", marginBottom: "4px" }}
                  itemStyle={{ fontWeight: "bold", color: "#4f46e5" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#4f46e5" 
                  strokeWidth={4} 
                  dot={{ r: 5, fill: "#4f46e5", strokeWidth: 3, stroke: "#fff" }} 
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card className="p-6 border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900">Ledger Activity</h3>
            <Button variant="ghost" size="sm" className="text-emerald-600 font-black uppercase text-[10px] tracking-widest">Export Logs</Button>
          </div>
          <div className="space-y-4 flex-1">
            {transactions.length > 0 ? transactions.slice(-4).reverse().map((txn) => (
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
                    {txn.type === 'deposit' ? '+' : '-'}${txn.amount.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Settled</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="p-4 bg-slate-50 rounded-full mb-4">
                  <Info className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No ledger activity found.</p>
                <Button variant="link" onClick={onAddSavings} className="text-emerald-600 font-bold">Start with Cash In</Button>
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
