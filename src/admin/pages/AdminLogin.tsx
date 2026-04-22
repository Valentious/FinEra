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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-600 p-3 text-white">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Admin Sign-In</h1>
            <p className="text-sm text-muted-foreground">Authorized stakeholders only</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2 rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-muted-foreground">Staff admin</strong> is separate from the member app. Sign in with an{" "}
              <span className="font-mono text-muted-foreground">AdminUser</span> row in the database, not your student/member
              password.
            </p>
            <p>
              After <span className="font-mono text-muted-foreground">npm run db:seed</span> (from{" "}
              <span className="font-mono text-muted-foreground">backend-core</span>), the default is{" "}
              <span className="font-mono text-muted-foreground">admin@finera.local</span> /{" "}
              <span className="font-mono text-muted-foreground">FinEraAdmin#2026!</span>
            </p>
            <p>
              To add another admin email, set <span className="font-mono text-muted-foreground">SEED_ADMIN_EMAIL</span> and{" "}
              <span className="font-mono text-muted-foreground">SEED_ADMIN_PASSWORD</span> in{" "}
              <span className="font-mono text-muted-foreground">backend-core/.env</span> and run{" "}
              <span className="font-mono text-muted-foreground">npm run db:seed</span> again.
            </p>
            {import.meta.env.DEV && (
              <p className="text-muted-foreground">
                Dev: if <span className="font-mono">ADMIN_PROTO_LOGIN=true</span> is set on the API, any password is
                accepted (development only).
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Username / Email</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-muted-foreground">
            <Fingerprint className="h-4 w-4 shrink-0" />
            Face ID / biometric - indicator only; wire device SDK in production.
          </div>
          {err && (
            <p className="rounded-lg border border-red-900 bg-red-950/80 px-3 py-2 text-sm text-red-200">
              Access denied - {err}
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
