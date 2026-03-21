/**
 * FinEra - Performance Portfolio Chart
 * Forex-style candlestick/line chart driven by Savings Wallet transactions.
 * Real-time, dynamic Y-axis, no mock data.
 */

import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import { createChart, ColorType, CandlestickSeries, LineSeries } from "lightweight-charts";
import { Button } from "@/app/components/ui/button";
import { TrendingUp, DollarSign, BarChart3, Percent } from "lucide-react";

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
  onTimeIntervalChange?: (interval: "hourly" | "daily" | "weekly") => void;
}

type TimeInterval = "hourly" | "daily" | "weekly";

/** Generate balance timeline from transactions (deposits + withdrawals affect savings) */
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

/** Aggregate timeline into OHLC by period */
function aggregateToOHLC(
  points: { time: number; balance: number; txnSummary?: string }[],
  interval: TimeInterval
): { open: number; high: number; low: number; close: number; time: number; txns?: string[] }[] {
  if (points.length === 0) return [];

  const bucketMs =
    interval === "hourly" ? 3600 * 1000
    : interval === "daily" ? 24 * 3600 * 1000
    : 7 * 24 * 3600 * 1000;

  const buckets = new Map<number, { balances: number[]; txns: string[] }>();

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const bucketKey = Math.floor(p.time / (bucketMs / 1000)) * (bucketMs / 1000);
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, { balances: [], txns: [] });
    }
    const b = buckets.get(bucketKey)!;
    b.balances.push(p.balance);
    if (p.txnSummary) b.txns.push(p.txnSummary);
  }

  // Fill gaps: if no event in a bucket, carry forward from previous
  const sortedKeys = Array.from(buckets.keys()).sort((a, b) => a - b);
  let lastClose = points[0]?.balance ?? 0;
  const result: { open: number; high: number; low: number; close: number; time: number; txns?: string[] }[] = [];

  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    const prevKey = i > 0 ? sortedKeys[i - 1] : key - bucketMs / 1000;
    const bucket = buckets.get(key)!;

    const open = i === 0 ? (bucket.balances[0] ?? lastClose) : (buckets.get(prevKey)?.balances.at(-1) ?? lastClose);
    const balances = [open, ...bucket.balances];
    const high = Math.max(...balances);
    const low = Math.min(...balances);
    const close = bucket.balances.at(-1) ?? open;
    lastClose = close;

    result.push({
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      time: key,
      txns: bucket.txns.length ? bucket.txns : undefined,
    });
  }
  return result;
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
  onTimeIntervalChange,
}: PerformancePortfolioChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ReturnType<typeof createChart> | null>(null);
  const candleRef = useRef<ReturnType<ReturnType<typeof createChart>["addSeries"]> | null>(null);
  const lineRef = useRef<ReturnType<ReturnType<typeof createChart>["addSeries"]> | null>(null);
  const [interval, setInterval] = useState<TimeInterval>("daily");
  const [showCandlestick, setShowCandlestick] = useState(true);
  const [metrics, setMetrics] = useState<{
    growthPct: number;
    netDeposits: number;
    interestEarned: number;
  }>({ growthPct: 0, netDeposits: 0, interestEarned: 0 });

  const timeline = useMemo(
    () => buildBalanceTimeline(transactions, currentBalance),
    [transactions, currentBalance]
  );

  const candleData = useMemo(
    () => aggregateToOHLC(timeline, interval),
    [timeline, interval]
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

  const handleInterval = useCallback(
    (iv: TimeInterval) => {
      setInterval(iv);
      onTimeIntervalChange?.(iv);
    },
    [onTimeIntervalChange]
  );

  useEffect(() => {
    if (!chartRef.current || candleData.length === 0) return;

    const isDark = true;
    const sym = currencySymbol;
    const chart = createChart(chartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0f172a" },
        textColor: "#94a3b8",
      },
      localization: {
        priceFormatter: (price: number) => `${sym}${price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
      },
      grid: {
        vertLines: { color: "rgba(148,163,184,0.1)" },
        horzLines: { color: "rgba(148,163,184,0.1)" },
      },
      width: chartRef.current.clientWidth,
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

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });
    candleRef.current = candleSeries;

    const lineSeries = chart.addSeries(LineSeries, {
      color: "#6366f1",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });
    lineRef.current = lineSeries;

    return () => {
      chart.remove();
      chartInstance.current = null;
      candleRef.current = null;
      lineRef.current = null;
    };
  }, [currencySymbol]);

  useEffect(() => {
    if (!candleRef.current || !lineRef.current) return;
    const candle = candleRef.current;
    const line = lineRef.current;

    if (showCandlestick && candleData.length > 0) {
      candle.applyOptions({ visible: true });
      line.applyOptions({ visible: false });
      candle.setData(
        candleData.map(({ open, high, low, close, time }) => ({ open, high, low, close, time }))
      );
    } else {
      candle.applyOptions({ visible: false });
      line.applyOptions({ visible: true });
      line.setData(lineData);
    }

    chartInstance.current?.timeScale().fitContent();
  }, [candleData, lineData, showCandlestick]);

  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current && chartRef.current) {
        chartInstance.current.applyOptions({ width: chartRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (candleData.length === 0 && timeline.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900 p-8 text-center">
        <p className="text-slate-400 font-medium">No portfolio data yet.</p>
        <p className="text-slate-500 text-sm mt-2">Deposits and withdrawals will populate the chart.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-700/50 overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Button
            variant={showCandlestick ? "default" : "ghost"}
            size="sm"
            className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setShowCandlestick(true)}
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            Candlestick
          </Button>
          <Button
            variant={!showCandlestick ? "default" : "ghost"}
            size="sm"
            className="h-8 rounded-lg text-slate-300 hover:bg-slate-800"
            onClick={() => setShowCandlestick(false)}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Line
          </Button>
        </div>
        <div className="flex items-center gap-1">
          {(["hourly", "daily", "weekly"] as const).map((iv) => (
            <Button
              key={iv}
              variant={interval === iv ? "default" : "ghost"}
              size="sm"
              className={`h-8 rounded-lg text-xs ${
                interval === iv ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-slate-800"
              }`}
              onClick={() => handleInterval(iv)}
            >
              {iv.charAt(0).toUpperCase() + iv.slice(1)}
            </Button>
          ))}
        </div>
      </div>

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
          <DollarSign className="w-4 h-4 text-slate-500" />
          <span className="text-slate-400 text-sm">Net deposits</span>
          <span className={`font-black ${metrics.netDeposits >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {metrics.netDeposits >= 0 ? "+" : ""}
            {currencySymbol}
            {metrics.netDeposits.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-amber-500" />
          <span className="text-slate-400 text-sm">Interest earned</span>
          <span className="font-black text-amber-400">
            {currencySymbol}
            {metrics.interestEarned.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div ref={chartRef} className="w-full" style={{ minHeight: 320 }} />
    </div>
  );
}
