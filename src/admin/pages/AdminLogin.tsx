import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../services/adminApi";
import { adminColors } from "../design-system/tokens";
import { ShieldCheck, Fingerprint } from "lucide-react";

export function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await adminLogin(email, password);
      nav("/admin", { replace: true });
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Access denied");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-600 p-3 text-white">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Admin Sign-In</h1>
            <p className="text-sm text-slate-400">Authorized stakeholders only</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400">Username / Email</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-500">
            <Fingerprint className="h-4 w-4 shrink-0" />
            Face ID / biometric — indicator only; wire device SDK in production.
          </div>
          {err && (
            <p className="rounded-lg border border-red-900 bg-red-950/80 px-3 py-2 text-sm text-red-200">
              Access denied — {err}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-bold text-white"
            style={{ backgroundColor: adminColors.safe }}
          >
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
