import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { fetchAdminOverview, fetchAdminActivity } from "../services/adminApi";
import type { IsoCurrency } from "../components/CurrencyTag";
import { RiskTag } from "../components/RiskTag";
import { adminColors } from "../design-system/tokens";

function mapRiskLevel(level: string): "Low" | "Medium" | "High" {
  const u = level.toUpperCase();
  if (u === "HIGH" || u === "VERY_HIGH") return "High";
  if (u === "MEDIUM") return "Medium";
  return "Low";
}

type OutletCtx = { currency: IsoCurrency };

export function DashboardHome() {
  const { currency } = useOutletContext<OutletCtx>();
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof fetchAdminOverview>>["data"] | null>(null);
  const [activity, setActivity] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const o = await fetchAdminOverview();
      setOverview(o.data);
      const a = await fetchAdminActivity();
      setActivity(a);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Overview — currency context: <strong>{currency}</strong> (filters client views; ledger isolation is server-side).
        </p>
      </div>

      {err && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {err} — check API and admin token.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total users" value={overview?.totalUsers ?? "—"} accent={adminColors.system} />
        <MetricCard title="Active loans" value={overview?.activeLoans ?? "—"} accent={adminColors.safe} />
        <MetricCard
          title="Default rate"
          value={overview ? `${(overview.defaultRate * 100).toFixed(1)}%` : "—"}
          accent={adminColors.warning}
        />
        <MetricCard title="Open fraud flags" value={overview?.openFraudFlags ?? "—"} accent={adminColors.risk} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5" style={{ borderColor: adminColors.border }}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Risk distribution</h2>
          <ul className="mt-4 space-y-2">
            {(overview?.riskDistribution ?? []).map((r) => (
              <li key={r.level} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <RiskTag level={mapRiskLevel(r.level)} />
                  <span className="text-slate-600">{r.level}</span>
                </span>
                <span className="font-mono font-semibold">{r.count}</span>
              </li>
            ))}
            {!overview?.riskDistribution?.length && <li className="text-slate-400">No data</li>}
          </ul>
        </section>

        <section className="rounded-2xl border bg-white p-5" style={{ borderColor: adminColors.border }}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Live activity (events)</h2>
          <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-100">
            {JSON.stringify(activity, null, 2)}
          </pre>
        </section>
      </div>

      <section className="rounded-2xl border bg-white p-5" style={{ borderColor: adminColors.border }}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">System health</h2>
        <p className="mt-2 text-lg font-semibold text-emerald-700">{overview?.systemHealth ?? "—"}</p>
      </section>
    </div>
  );
}

function MetricCard({ title, value, accent }: { title: string; value: string | number; accent: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: adminColors.border }}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-black tabular-nums" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}
