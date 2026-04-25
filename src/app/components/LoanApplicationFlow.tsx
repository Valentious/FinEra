import type { LoanType } from "@/loan/loanTypes";
import {
  getLoanProductLabel,
  getLoanProductShortDescription,
  requiresCollateralStep,
} from "@/loan/loanTypes";

interface LoanApplicationFlowProps {
  loanType: LoanType;
  step: "amount" | "collateral" | "confirm";
  className?: string;
}

/**
 * Lightweight flow header for loan screens - keeps role-based context visible.
 */
export function LoanApplicationFlow({ loanType, step, className = "" }: LoanApplicationFlowProps) {
  const label = getLoanProductLabel(loanType);
  const desc = getLoanProductShortDescription(loanType);
  const order = requiresCollateralStep(loanType)
    ? (["amount", "collateral", "confirm"] as const)
    : (["amount", "confirm"] as const);
  const idx = order.indexOf(step as (typeof order)[number]);
  const safeIdx = idx >= 0 ? idx : 0;
  const total = order.length;
  const pct = ((safeIdx + 1) / total) * 100;

  const assetOrCollateral = requiresCollateralStep(loanType);
  const hideProductTitle = loanType === "SALARY_BACKED";

  if (assetOrCollateral) {
    return (
      <div
        className={`rounded-2xl border border-slate-200/90 bg-white p-4 text-black shadow-sm dark:border-slate-600 dark:bg-slate-950 ${className}`}
      >
        <div>
          <div
            className={`flex items-start gap-3 ${hideProductTitle ? "justify-end" : "justify-between"}`}
          >
            {!hideProductTitle && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-black dark:text-zinc-100">
                  {label}
                </p>
                <p className="mt-1 text-xs font-medium text-black/90 dark:text-zinc-300">{desc}</p>
              </div>
            )}
            <span className="whitespace-nowrap text-[10px] font-semibold tabular-nums text-black dark:text-zinc-200">
              Step {safeIdx + 1}/{total}
            </span>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-slate-200/80 dark:border-slate-600 bg-white/80 dark:bg-slate-900/40 p-4 ${className}`}>
      <div className={`flex items-start gap-3 ${hideProductTitle ? "justify-end" : "justify-between"}`}>
        {!hideProductTitle && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              {label}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{desc}</p>
          </div>
        )}
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
