/**
 * FinEra - Performance Portfolio Chart
 * Line chart driven by per-currency wallet (ledger) transactions.
 * Real-time, dynamic Y-axis, no mock data.
 */

import { useRef, useEffect, useMemo, useState } from "react";
import { createChart, ColorType, LineSeries } from "lightweight-charts";
import { TrendingUp, DollarSign } from "lucide-react";

export interface TransactionInput {
  id: string;
  type: "deposit" | "withdrawal" | "loan" | "repayment";
  amount: number;
  date: string;
  description: string;
}

interface PerformancePortfolioChartProps {
  transactions: TransactionInput[];
  currentBalance: number;
  currencySymbol?: string;
}

/** Generate balance timeline from transactions (deposits + withdrawals affect wallet balance) */
function buildBalanceTimeline(
  transactions: TransactionInput[],
  currentBalance: number
): { time: number; balance: number; txnSummary?: string }[] {
  const savingsTxns = transactions
    .filter((t) => t.type === "deposit" || t.type === "withdrawal")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const points: { time: number; balance: number; txnSummary?: string }[] = [];
  let balance = 0;

  if (savingsTxns.length > 0) {
    const firstTs = Math.floor(new Date(savingsTxns[0].date).getTime() / 1000);
    points.push({ time: firstTs - 1, balance: 0 }); // Balance at period start before first txn
  }

  for (const t of savingsTxns) {
    const ts = Math.floor(new Date(t.date).getTime() / 1000);
    if (t.type === "deposit") balance += t.amount;
    else balance -= t.amount;
    points.push({
      time: ts,
      balance,
      txnSummary: `${t.type}: ${t.description} (${t.type === "deposit" ? "+" : "-"}${t.amount})`,
    });
  }

  // Ensure we have a point for "now" with current balance
  const now = Math.floor(Date.now() / 1000);
  if (points.length === 0) {
    points.push({ time: now, balance: currentBalance });
  } else {
    const last = points[points.length - 1];
    if (last.balance !== currentBalance || last.time < now - 60) {
      points.push({ time: now, balance: currentBalance });
    }
  }
  return points;
}

/** Convert to lightweight-charts LineData */
function toLineData(
  points: { time: number; balance: number }[]
): { time: number; value: number }[] {
  return points.map((p) => ({ time: p.time, value: p.balance }));
}

export function PerformancePortfolioChart({
  transactions,
  currentBalance,
  currencySymbol = "$",
}: PerformancePortfolioChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ReturnType<typeof createChart> | null>(null);
  const lineRef = useRef<ReturnType<ReturnType<typeof createChart>["addSeries"]> | null>(null);
  const [metrics, setMetrics] = useState<{
    growthPct: number;
    netDeposits: number;
    interestEarned: number;
  }>({ growthPct: 0, netDeposits: 0, interestEarned: 0 });

  const timeline = useMemo(
    () => buildBalanceTimeline(transactions, currentBalance),
    [transactions, currentBalance]
  );

  const lineData = useMemo(() => toLineData(timeline), [timeline]);

  // Compute metrics from transactions
  const computedMetrics = useMemo(() => {
    const deposits = transactions
      .filter((t) => t.type === "deposit")
      .reduce((s, t) => s + t.amount, 0);
    const withdrawals = transactions
      .filter((t) => t.type === "withdrawal")
      .reduce((s, t) => s + t.amount, 0);
    const netDeposits = deposits - withdrawals;
    const firstBalance = timeline[0]?.balance ?? 0;
    const lastBalance = timeline[timeline.length - 1]?.balance ?? currentBalance;
    const growthPct =
      firstBalance > 0 ? ((lastBalance - firstBalance) / firstBalance) * 100 : (lastBalance > 0 ? 100 : 0);
    // Interest = growth beyond net deposits (simplified)
    const interestEarned = Math.max(0, lastBalance - firstBalance - netDeposits);
    return { growthPct, netDeposits, interestEarned };
  }, [transactions, timeline, currentBalance]);

  useEffect(() => {
    setMetrics(computedMetrics);
  }, [computedMetrics]);

  useEffect(() => {
    if (!chartRef.current) return;

    const sym = currencySymbol;
    const w = Math.max(chartRef.current.clientWidth || 0, 1);

    let chart: ReturnType<typeof createChart> | null = null;
    try {
      chart = createChart(chartRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#0f172a" },
          textColor: "#e2e8f0",
        },
        localization: {
          priceFormatter: (price: number) =>
            `${sym}${price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
        },
        grid: {
          vertLines: { color: "rgba(148,163,184,0.1)" },
          horzLines: { color: "rgba(148,163,184,0.1)" },
        },
        width: w,
        height: 320,
        rightPriceScale: {
          borderColor: "rgba(148,163,184,0.2)",
          scaleMargins: { top: 0.1, bottom: 0.2 },
          autoScale: true,
        },
        timeScale: {
          borderColor: "rgba(148,163,184,0.2)",
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          vertLine: { labelVisible: true },
          horzLine: { labelVisible: true },
        },
        handleScroll: { vertTouchDrag: true, horzTouchDrag: true },
      });

      chartInstance.current = chart;

      const lineSeries = chart.addSeries(LineSeries, {
        color: "#6366f1",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
      });
      lineRef.current = lineSeries;
    } catch (e) {
      console.error("[FinEra] Chart init failed:", e);
      chartInstance.current = null;
      lineRef.current = null;
    }

    return () => {
      try {
        chart?.remove();
      } catch {
        /* ignore */
      }
      chartInstance.current = null;
      lineRef.current = null;
    };
  }, [currencySymbol]);

  useEffect(() => {
    if (!lineRef.current) return;
    try {
      const sorted = [...lineData].sort((a, b) => a.time - b.time);
      lineRef.current.setData(sorted);
      chartInstance.current?.timeScale().fitContent();
    } catch (e) {
      console.error("[FinEra] Chart setData failed:", e);
    }
  }, [lineData]);

  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current && chartRef.current) {
        chartInstance.current.applyOptions({ width: chartRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (timeline.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900 p-8 text-center">
        <p className="text-slate-200 font-medium">No portfolio data yet.</p>
        <p className="text-slate-300 text-sm mt-2">Cash in and cash out will populate the chart.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-700/50 overflow-hidden">
      {/* Metrics overlay */}
      <div className="flex flex-wrap gap-6 px-4 py-3 border-b border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-4 h-4 ${metrics.growthPct >= 0 ? "text-emerald-500" : "text-red-500"}`} />
          <span className="text-slate-400 text-sm">Growth</span>
          <span className={`font-black ${metrics.growthPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {metrics.growthPct >= 0 ? "+" : ""}
            {metrics.growthPct.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-slate-300" />
          <span className="text-slate-200 text-sm">Net cash in</span>
          <span className={`font-black ${metrics.netDeposits >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {metrics.netDeposits >= 0 ? "+" : ""}
            {currencySymbol}
            {metrics.netDeposits.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div ref={chartRef} className="w-full" style={{ minHeight: 320 }} />
    </div>
  );
}
