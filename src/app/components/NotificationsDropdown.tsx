/**
 * FinEra - Notification bell: fixed in-app guidance only (no API / inbox list).
 * Slides down from below the top bar — WhatsApp-style green presentation.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/app/components/ui/button";
import { Bell, Wallet, ShieldAlert } from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import { AnimatePresence, motion } from "motion/react";

type FixedVisual = "system" | "security";

const FIXED_COLORS: Record<FixedVisual, string> = {
  system: "bg-emerald-50 text-emerald-700",
  security: "bg-emerald-300/50 text-emerald-950",
};

const FIXED_ICONS: Record<FixedVisual, typeof Wallet> = {
  system: Wallet,
  security: ShieldAlert,
};

/** Shown on every open of the bell — product-fixed copy. */
const FIXED_SYSTEM_MESSAGES: readonly { id: string; title: string; message: string; visual: FixedVisual }[] = [
  {
    id: "finera-fixed-account-purpose",
    title: "Account purpose",
    message:
      "Your Wallet IDs identify you for transfers and support. Fund your FinCash wallets for savings, loans, and repayments in FinEra Inclusive Credit.",
    visual: "system",
  },
  {
    id: "finera-fixed-security",
    title: "Security",
    message: "Never share your password. FinEra staff will never ask for your password by email or phone.",
    visual: "security",
  },
];

const HEADER_H = 64;

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const panel = (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            key="notif-backdrop"
            aria-label="Close notifications"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-0 left-0 right-0 z-[38] bg-slate-900/35 backdrop-blur-[2px]"
            style={{ top: HEADER_H }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            key="notif-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notifications-panel-title"
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 380 }}
            className={cn(
              "fixed z-[39] flex max-h-[min(78vh,calc(100vh-5rem))] w-[calc(100%-1rem)] max-w-md flex-col overflow-hidden",
              "left-1/2 -translate-x-1/2 rounded-b-3xl border border-t-0 border-emerald-200/80 bg-emerald-50/98 shadow-2xl shadow-emerald-950/15 backdrop-blur-md",
              "sm:left-auto sm:right-4 sm:translate-x-0"
            )}
            style={{ top: HEADER_H }}
          >
            <div className="shrink-0 bg-emerald-600 px-4 py-3 text-white shadow-sm">
              <div className="min-w-0">
                <h3 id="notifications-panel-title" className="text-lg font-black tracking-tight">
                  Notifications
                </h3>
                <p className="text-[11px] font-medium text-emerald-100/95">
                  Key information for your FinEra account
                </p>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-emerald-50/90 to-emerald-100/40">
              <div
                className="border-b border-emerald-200/70 bg-emerald-50/80 px-3 py-3"
                role="region"
                aria-label="FinEra system messages"
              >
                <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-emerald-800/80">
                  System messages
                </p>
                <ul className="space-y-2">
                  {FIXED_SYSTEM_MESSAGES.map((msg) => {
                    const Icon = FIXED_ICONS[msg.visual];
                    return (
                      <li
                        key={msg.id}
                        className="rounded-2xl border border-emerald-200/80 bg-white/90 p-2.5 shadow-sm shadow-emerald-950/5"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "mt-0.5 shrink-0 rounded-xl p-2.5 shadow-sm",
                              FIXED_COLORS[msg.visual]
                            )}
                          >
                            <Icon className="h-4 w-4" aria-hidden />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-emerald-950">{msg.title}</p>
                            <p className="mt-0.5 text-xs leading-relaxed text-emerald-900/85">{msg.message}</p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Notifications, system messages"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 rounded-full",
          "border border-white/40 bg-white/15 text-zinc-800 shadow-md shadow-primary/15 dark:text-zinc-100",
          "ring-2 ring-white/45 ring-offset-2 ring-offset-transparent",
          "hover:bg-white/25 hover:ring-white/55 dark:hover:bg-white/20",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        )}
      >
        <Bell className="h-5 w-5" strokeWidth={2.25} aria-hidden />
      </Button>

      {typeof document !== "undefined" ? createPortal(panel, document.body) : null}
    </>
  );
}
