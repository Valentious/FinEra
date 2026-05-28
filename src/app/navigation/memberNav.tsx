import { useMemo } from "react";
import {
  LayoutDashboard,
  FileText,
  Settings,
  HelpCircle,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import { useI18n } from "@/app/providers/I18nProvider";
import type { AppAccountType } from "@/loan/loanTypes";

export const MEMBER_NAV_IDS = [
  "dashboard",
  "editEmploymentDetails",
  "agreementsConsent",
  "identityVerification",
  "profileSettings",
  "helpCentre",
] as const;

export type MemberNavId = (typeof MEMBER_NAV_IDS)[number];

export function isMemberNavId(id: string): id is MemberNavId {
  return (MEMBER_NAV_IDS as readonly string[]).includes(id);
}

export type MemberNavItem = {
  id: MemberNavId;
  label: string;
  icon: LucideIcon;
};

export function useMemberNavItems(accountType?: AppAccountType): MemberNavItem[] {
  const { t } = useI18n();
  const agreementsConsentLabel =
    accountType === "student"
      ? "Upload Current Result Slip"
      : accountType === "alumni"
        ? "Collateral Documents"
        : "Repayment Details";

  const items = useMemo(
    () => [
      { id: "dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
      ...(accountType === "staff" ? [{ id: "editEmploymentDetails" as const, label: "Edit Employment Details", icon: Briefcase }] : []),
      { id: "agreementsConsent", label: agreementsConsentLabel, icon: FileText },
      { id: "identityVerification", label: t("nav.identityVerification"), icon: ShieldCheck },
      { id: "profileSettings", label: t("nav.accountSettings"), icon: Settings },
      { id: "helpCentre", label: t("nav.helpCentre"), icon: HelpCircle },
    ],
    [agreementsConsentLabel, t, accountType],
  );

  return items;
}

export function MobileBottomNav({
  className,
  activeScreen,
  onNavigate,
  accountType,
}: {
  className?: string;
  activeScreen: string;
  onNavigate: (screen: string) => void;
  accountType?: AppAccountType;
}) {
  const items = useMemberNavItems(accountType);
  const activeId: MemberNavId | null = isMemberNavId(activeScreen) ? activeScreen : null;

  return (
    <nav
      role="navigation"
      aria-label="Main"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[35] flex h-16 items-center justify-around border-t border-border bg-background",
        className,
      )}
    >
      {items.map((item) => {
        const active = activeId === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1"
          >
            <Icon
              className={cn("h-5 w-5 shrink-0 stroke-[2]", active ? "text-primary" : "text-muted-foreground")}
              aria-hidden
            />
            <span
              className={cn(
                "line-clamp-2 w-full text-center text-xs font-medium leading-tight",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
