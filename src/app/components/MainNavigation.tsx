import { Button } from "@/app/components/ui/button";
import {
  LayoutDashboard,
  Zap,
  PiggyBank,
  GraduationCap,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Handshake,
  FileText,
} from "lucide-react";
import { FinEraShieldIcon } from "@/app/components/FinEraShieldIcon";
import { FinEraLogoText } from "@/app/components/FinEraLogoText";
import { NotificationsDropdown } from "@/app/components/NotificationsDropdown";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  isAdmin?: boolean;
  onCreateWallet?: () => void;
  /** Same 0-100 bands as dashboard TrustScore card background */
  disciplineScore?: number;
}

export function MainNavigation({
  activeScreen,
  onNavigate,
  onLogout,
  userName,
  accountNumber,
  walletNumericId,
  isAdmin,
  onCreateWallet,
}: MainNavigationProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t } = useI18n();

  const navItems = [
    { id: "dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { id: "quickActions", label: t("nav.quickActions"), icon: Zap },
    { id: "savingsWallet", label: t("nav.finCashWallet"), icon: PiggyBank },
    { id: "financialEducation", label: t("nav.learningHub"), icon: GraduationCap },
    { id: "profileSettings", label: t("nav.accountSettings"), icon: Settings },
    { id: "agreementsConsent", label: "Agreements & Consent", icon: FileText },
    { id: "partnerProgram", label: t("nav.partnerProgram"), icon: Handshake },
  ];

  return (
    <>
      {/* Topbar - fixed brand green (not discipline-score bands) */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-stretch border-b border-white/25 bg-gradient-to-br from-primary to-[#1ebe5d] px-4 text-white shadow-[0_8px_24px_-8px_rgba(37,211,102,0.35)]">
        <div className="pointer-events-none absolute -right-12 -top-10 h-36 w-44 rounded-full bg-white/20 blur-2xl" aria-hidden />
        <div className="relative z-10 flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/15"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex cursor-pointer items-center gap-2" onClick={() => onNavigate("dashboard")}>
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
            <NotificationsDropdown onNavigate={onNavigate} />
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
              >
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Desktop */}
      <aside className="fixed left-0 top-16 bottom-0 z-30 hidden w-64 flex-col border-r border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 md:flex">
        <div className="flex-1 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeScreen === item.id
                  ? "bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100/50 dark:bg-emerald-500/15 dark:text-foreground dark:shadow-none"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground dark:hover:bg-sidebar-accent"
              }`}
            >
              <item.icon
                className={`w-5 h-5 ${activeScreen === item.id ? "text-emerald-600 dark:text-foreground" : "text-muted-foreground"}`}
              />
              <span className="font-medium">{item.label}</span>
              {activeScreen === item.id && (
                <motion.div layoutId="activeNav" className="ml-auto w-1.5 h-1.5 bg-emerald-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-50">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t("nav.signOut")}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-white z-[60] md:hidden flex flex-col p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-2">
                  <FinEraShieldIcon size={32} className="rounded-lg" />
                  <div className="flex flex-col leading-tight">
                    <FinEraLogoText variant="light" size="md" as="span" className="font-bold text-lg" />
                    <span className="font-semibold text-xs text-muted-foreground tracking-wider uppercase">INCLUSIVE CREDIT</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="flex-1 space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
                      activeScreen === item.id 
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" 
                        : "text-muted-foreground hover:bg-slate-50"
                    }`}
                  >
                    <item.icon className={`w-6 h-6 ${activeScreen === item.id ? "text-white" : "text-muted-foreground"}`} />
                    <span className="font-bold text-lg">{item.label}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={onLogout}
                className="mt-auto w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-500 hover:bg-red-50"
              >
                <LogOut className="w-6 h-6" />
                <span className="font-bold text-lg">{t("nav.signOut")}</span>
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}