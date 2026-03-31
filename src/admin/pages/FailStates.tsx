import type { ReactNode } from "react";
import { adminColors } from "../design-system/tokens";
import { ShieldOff, AlertTriangle, Scale } from "lucide-react";

export function AccessDenied() {
  return (
    <FailShell
      icon={<ShieldOff className="h-10 w-10 text-red-600" />}
      title="Access denied"
      body="Your session does not have rights for this action. All authorization is enforced on the server."
    />
  );
}

export function SystemErrorPage() {
  return (
    <FailShell
      icon={<AlertTriangle className="h-10 w-10 text-amber-600" />}
      title="System error"
      body="An unexpected error occurred. Retry or contact platform operations."
    />
  );
}

export function LedgerMismatchAlert() {
  return (
    <FailShell
      icon={<Scale className="h-10 w-10 text-red-700" />}
      title="Ledger mismatch alert"
      body="Custody vs liability reconciliation failed — halt payouts until ops clears the variance."
    />
  );
}

function FailShell({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="rounded-2xl border bg-white p-10 shadow-sm" style={{ borderColor: adminColors.border }}>
        <div className="mb-4 flex justify-center">{icon}</div>
        <h1 className="text-xl font-black text-slate-900">{title}</h1>
        <p className="mt-2 max-w-md text-sm text-slate-600">{body}</p>
      </div>
    </div>
  );
}
