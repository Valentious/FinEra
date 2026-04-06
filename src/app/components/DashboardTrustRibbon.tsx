/**
 * Fixed bottom trust ribbon across member and admin shells.
 * Text is static (no opacity cycling).
 */
export function DashboardTrustRibbon({
  accountMode,
  insetForSidebar = true,
  /** Tailwind left offset on md+ when `insetForSidebar` (e.g. `md:left-56` for admin sidebar). */
  sidebarInsetClassName = "md:left-64",
}: {
  accountMode?: "real" | "demo";
  /** When true, indents on md+ to clear the sidebar (member dashboard / admin layout). */
  insetForSidebar?: boolean;
  sidebarInsetClassName?: string;
}) {
  const isDemo = accountMode === "demo";
  return (
    <div
      className={[
        "pointer-events-none fixed bottom-0 left-0 right-0 z-20",
        insetForSidebar ? sidebarInsetClassName : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
    >
      <div
        className={[
          "mx-auto max-w-[100vw] border-t px-3 py-3 rounded-t-xl sm:px-5",
          "pb-[max(0.625rem,calc(0.625rem+env(safe-area-inset-bottom,0px)))]",
          isDemo
            ? "border-violet-200/80 bg-violet-50/95 shadow-[0_-1px_0_rgba(124,58,237,0.08)] dark:border-violet-800/50 dark:bg-violet-950/90"
            : "border-emerald-200/70 bg-emerald-50/95 shadow-[0_-1px_0_rgba(16,185,129,0.06)] dark:border-emerald-800/50 dark:bg-emerald-950/92",
        ].join(" ")}
      >
        <p
          className={[
            "text-center text-balance text-sm font-medium leading-snug tracking-wide antialiased opacity-100 sm:text-base",
            isDemo ? "text-violet-950/90 dark:text-violet-100/88" : "text-emerald-900/88 dark:text-emerald-100/85",
          ].join(" ")}
        >
          {isDemo
            ? "Demo account - balances and credit events are simulated for practice only. Open a real account for live funds and obligations."
            : "Financial services facilitated in cooperation with SPC Microfinance"}
        </p>
      </div>
    </div>
  );
}
