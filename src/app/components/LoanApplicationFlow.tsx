import type { LoanType } from "@/loan/loanTypes";
import {
  getLoanProductLabel,
  getLoanProductShortDescription,
  requiresCollateralStep,
} from "@/loan/loanTypes";

interface LoanApplicationFlowProps {
  loanType: LoanType;
  step: "purpose" | "amount" | "collateral" | "confirm";
  className?: string;
}

/**
 * Lightweight flow header for loan screens - keeps role-based context visible.
 */
export function LoanApplicationFlow({ loanType, step, className = "" }: LoanApplicationFlowProps) {
  const label = getLoanProductLabel(loanType);
  const desc = getLoanProductShortDescription(loanType);
  const order = requiresCollateralStep(loanType)
    ? (["purpose", "amount", "collateral", "confirm"] as const)
    : (["purpose", "amount", "confirm"] as const);
  const idx = order.indexOf(step as (typeof order)[number]);
  const safeIdx = idx >= 0 ? idx : 0;
  const total = order.length;
  const pct = ((safeIdx + 1) / total) * 100;

  const assetOrCollateral = requiresCollateralStep(loanType);

  if (assetOrCollateral) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border-none bg-gradient-to-br from-primary to-[#1ebe5d] p-4 text-white shadow-[0_8px_24px_-8px_rgba(37,211,102,0.35)] ${className}`}
      >
        <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-white/20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white">{label}</p>
              <p className="mt-1 text-xs font-medium text-white/80">{desc}</p>
            </div>
            <span className="whitespace-nowrap text-[10px] font-semibold tabular-nums text-white/80">
              Step {safeIdx + 1}/{total}
            </span>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/25">
            <div className="h-full bg-white transition-all duration-300" style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-slate-200/80 dark:border-slate-600 bg-white/80 dark:bg-slate-900/40 p-4 ${className}`}>
      <div className="flex justify-between items-start gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            {label}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">{desc}</p>
        </div>
        <span className="text-[10px] font-black text-muted-foreground whitespace-nowrap">
          Step {safeIdx + 1}/{total}
        </span>
      </div>
      <div className="mt-3 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}
