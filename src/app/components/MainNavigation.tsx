import { cn } from "@/app/components/ui/utils";
import { LogOut, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FinEraShieldIcon } from "@/app/components/FinEraShieldIcon";
import { FinEraLogoText } from "@/app/components/FinEraLogoText";
import { NotificationsDropdown } from "@/app/components/NotificationsDropdown";
import { useMemberNavItems, isMemberNavId, type MemberNavId } from "@/app/navigation/memberNav";
import { useI18n } from "@/app/providers/I18nProvider";

interface MainNavigationProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  userName: string;
  /** Legacy / internal account reference */
  accountNumber?: string;
  /** 10-digit public Wallet ID (Binance-style peer transfer) */
  walletNumericId?: string;
}

function SidebarNavItem({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-200",
        active
          ? "bg-primary/[0.09] text-emerald-900 shadow-[0_1px_2px_rgba(16,185,129,0.14)] ring-1 ring-primary/[0.12] dark:bg-emerald-500/12 dark:text-emerald-50 dark:ring-emerald-500/25"
          : "text-muted-foreground hover:bg-slate-50/95 dark:hover:bg-slate-800/70",
      )}
    >
      <Icon
        className={cn("h-5 w-5 shrink-0 stroke-[2]", active ? "text-primary" : "text-muted-foreground")}
        aria-hidden
      />
      <span className="min-w-0 flex-1 text-sm font-semibold leading-snug tracking-tight">{label}</span>
      {active ? (
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_0_3px_rgba(37,211,102,0.18)] dark:shadow-[0_0_0_3px_rgba(52,211,153,0.25)]"
          aria-hidden
        />
      ) : null}
    </button>
  );
}

export function MainNavigation({
  activeScreen,
  onNavigate,
  onLogout,
  userName,
  accountNumber,
  walletNumericId,
}: MainNavigationProps) {
  const { t } = useI18n();
  const navItems = useMemberNavItems();
  const sidebarActiveId: MemberNavId | null = isMemberNavId(activeScreen) ? activeScreen : null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-stretch border-b border-white/25 bg-gradient-to-br from-primary to-[#1ebe5d] px-4 text-white shadow-[0_8px_24px_-8px_rgba(37,211,102,0.35)]">
        <div className="pointer-events-none absolute -right-12 -top-10 h-36 w-44 rounded-full bg-white/20 blur-2xl" aria-hidden />
        <div className="relative z-10 flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex cursor-pointer items-center gap-2"
              onClick={() => onNavigate("dashboard")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onNavigate("dashboard");
                }
              }}
              role="button"
              tabIndex={0}
            >
              <FinEraShieldIcon size={32} className="rounded-lg ring-1 ring-white/35" />
              <div className="hidden flex-col leading-tight sm:flex">
                <FinEraLogoText
                  variant="dark"
                  size="md"
                  as="span"
                  className="font-bold text-lg text-white [&_.fin]:text-white [&_.era]:text-emerald-100"
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                  INCLUSIVE CREDIT
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationsDropdown />
            <div className="mx-1 h-8 w-px bg-white/35" />
            <div className="flex items-center gap-2 pl-2">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-none text-white">{userName}</p>
                <p className="text-[10px] font-medium tracking-wide text-emerald-100/90">
                  {walletNumericId
                    ? `Wallet ID: ${walletNumericId}`
                    : accountNumber
                      ? `Acc: ${accountNumber}`
                      : "Verified Member"}
                </p>
              </div>
              <div
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-white/40 bg-white/20 hover:bg-white/30"
                onClick={() => onNavigate("profileSettings")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onNavigate("profileSettings");
                  }
                }}
                aria-label={t("nav.accountSettings")}
              >
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-16 z-30 hidden w-64 flex-col border-r border-slate-100 bg-white shadow-[1px_0_12px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-950 md:flex",
        )}
      >
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main">
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.id}
              active={sidebarActiveId === item.id}
              icon={item.icon}
              label={item.label}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden />
            <span className="text-sm font-semibold">{t("nav.signOut")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
