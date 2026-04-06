import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import { adminLogout, fetchAdminSession } from "./services/adminApi";
import { AdminLayout } from "./layout/AdminLayout";
import { AdminLogin } from "./pages/AdminLogin";
import { DashboardHome } from "./pages/DashboardHome";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { AccessDenied } from "./pages/FailStates";
import { useAdminWebSocket } from "./hooks/useAdminWebSocket";
import { useAdminPolling } from "./hooks/useAdminPolling";
import { useState, useCallback, useEffect } from "react";
import { DashboardTrustRibbon } from "@/app/components/DashboardTrustRibbon";

/** Dev-only: set `VITE_ADMIN_DEV_BYPASS=true` in `.env.local` to skip session check. */
const ADMIN_DEV_BYPASS =
  import.meta.env.DEV && String(import.meta.env.VITE_ADMIN_DEV_BYPASS ?? "").toLowerCase() === "true";

function RequireAdmin() {
  const [state, setState] = useState<"loading" | "ok" | "no">(ADMIN_DEV_BYPASS ? "ok" : "loading");

  useEffect(() => {
    if (ADMIN_DEV_BYPASS) return;
    let cancelled = false;
    fetchAdminSession()
      .then((ok) => {
        if (!cancelled) setState(ok ? "ok" : "no");
      })
      .catch(() => {
        if (!cancelled) setState("no");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 pb-[max(1.5rem,calc(3.25rem+env(safe-area-inset-bottom,0px)))] text-slate-400">
        Checking session…
        <DashboardTrustRibbon insetForSidebar={false} />
      </div>
    );
  }
  if (state === "no") {
    // Must be absolute - relative `to="login"` from `/admin` resolves to `/login`, which matches
    // the root `/*` route and mounts the member App instead of admin login.
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}

function AdminShell() {
  const nav = useNavigate();
  const { connected } = useAdminWebSocket(true);
  const [, setPoll] = useState(0);
  const refresh = useCallback(() => setPoll((p) => p + 1), []);
  useAdminPolling(!connected, 20000, refresh);

  async function onLogout() {
    try {
      await adminLogout();
    } catch {
      /* still navigate away */
    }
    nav("/admin/login", { replace: true });
  }

  return <AdminLayout wsConnected={connected} onLogout={onLogout} />;
}

export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route path="denied" element={<AccessDenied />} />
      <Route element={<RequireAdmin />}>
        <Route element={<AdminShell />}>
          <Route index element={<DashboardHome />} />
          <Route path="users" element={<PlaceholderPage title="Users & admin management" />} />
          <Route path="wallets" element={<PlaceholderPage title="Wallets & ledger monitoring" />} />
          <Route path="credit-intelligence" element={<PlaceholderPage title="Credit intelligence" />} />
          <Route
            path="agent-governance"
            element={
              <PlaceholderPage title="FinEra Verified Agent Registry (FVAR)">
                <p className="text-slate-600">
                  Minimum savings balance rule ($3,000 USD equivalent) and compliance score - wire suspend/reinstate APIs with audit.
                </p>
              </PlaceholderPage>
            }
          />
          <Route path="risk-monitor" element={<PlaceholderPage title="Risk & compliance monitor" />} />
          <Route path="transactions" element={<PlaceholderPage title="Transactions" />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
