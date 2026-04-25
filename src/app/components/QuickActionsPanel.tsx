import { HandCoins, Plus, ArrowDown, Wallet, Send, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { useI18n } from "@/app/providers/I18nProvider";

export interface QuickActionsPanelProps {
  onAddSavings: () => void;
  onViewRepayment: () => void;
  onWithdrawFunds: () => void;
  onMakePayment?: () => void;
  onPeerTransfer?: () => void;
  /** Tighter icon grid when embedded on the dashboard */
  compact?: boolean;
}

type QuickActionItem = {
  key: string;
  label: string;
  Icon: LucideIcon;
  onClick: () => void;
  shell: string;
  iconClass: string;
};

function AppIconTile({
  label,
  Icon,
  onClick,
  shell,
  iconClass,
  compact,
}: {
  label: string;
  Icon: LucideIcon;
  onClick: () => void;
  shell: string;
  iconClass: string;
  compact: boolean;
}) {
  const box = compact ? "h-12 w-12 sm:h-14 sm:w-14" : "h-14 w-14 sm:h-16 sm:w-16";
  const glyph = compact ? "h-6 w-6 sm:h-7 sm:w-7" : "h-7 w-7 sm:h-8 sm:w-8";

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 520, damping: 28 }}
      onClick={onClick}
      className="flex w-full max-w-[5.25rem] flex-col items-center gap-1.5 rounded-xl p-1 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:max-w-[5.75rem]"
    >
      <span
        className={`flex ${box} shrink-0 items-center justify-center rounded-[22%] shadow-lg ring-1 ring-black/5 dark:ring-white/10 ${shell}`}
        aria-hidden
      >
        <Icon className={`${glyph} ${iconClass}`} strokeWidth={2.25} />
      </span>
      <span className="line-clamp-2 w-full px-0.5 text-[10px] font-semibold leading-tight tracking-tight text-foreground sm:text-[11px]">
        {label}
      </span>
    </motion.button>
  );
}

export function QuickActionsPanel({
  onAddSavings,
  onViewRepayment,
  onWithdrawFunds,
  onMakePayment,
  onPeerTransfer,
  compact = false,
}: QuickActionsPanelProps) {
  const { t } = useI18n();

  const items: QuickActionItem[] = [
    {
      key: "repay",
      label: t("quick.repayLoan"),
      Icon: HandCoins,
      onClick: onViewRepayment,
      shell: "bg-green-600 shadow-green-950/30",
      iconClass: "text-white",
    },
    {
      key: "cashIn",
      label: t("quick.cashIn"),
      Icon: Plus,
      onClick: onAddSavings,
      shell: "bg-emerald-600 shadow-emerald-950/30",
      iconClass: "text-white",
    },
    {
      key: "cashOut",
      label: t("quick.cashOut"),
      Icon: ArrowDown,
      onClick: onWithdrawFunds,
      shell: "bg-slate-600 shadow-slate-950/35 dark:bg-slate-500",
      iconClass: "text-white",
    },
    ...(onPeerTransfer
      ? [
          {
            key: "transfer",
            label: t("quick.transfer"),
            Icon: Send,
            onClick: onPeerTransfer,
            shell: "bg-indigo-600 shadow-indigo-950/35",
            iconClass: "text-white",
          } satisfies QuickActionItem,
        ]
      : []),
    ...(onMakePayment
      ? [
          {
            key: "pay",
            label: t("quick.makePayment"),
            Icon: Wallet,
            onClick: onMakePayment,
            shell: "bg-amber-500 shadow-amber-950/35",
            iconClass: "text-white",
          } satisfies QuickActionItem,
        ]
      : []),
  ];

  return (
    <div
      className={
        compact
          ? "rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40"
          : "rounded-2xl border border-slate-100 bg-card p-6 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
      }
    >
      <p className="mb-4 text-balance text-left text-xs font-extrabold uppercase leading-snug tracking-wide text-foreground sm:text-sm">
        {t("quick.eyebrow")}
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(4.75rem,1fr))] justify-items-center gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-5">
        {items.map((item) => (
          <AppIconTile
            key={item.key}
            label={item.label}
            Icon={item.Icon}
            onClick={item.onClick}
            shell={item.shell}
            iconClass={item.iconClass}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
