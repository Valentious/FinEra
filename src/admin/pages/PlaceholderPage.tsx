import type { ReactNode } from "react";
import { adminColors } from "../design-system/tokens";

export function PlaceholderPage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-slate-900">{title}</h1>
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: adminColors.border }}>
        {children ?? <p className="text-slate-600">Screen scaffold - connect APIs and modals for audit-backed actions.</p>}
      </div>
    </div>
  );
}
