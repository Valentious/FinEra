/**
 * FinEra - In-app notification center (admin-curated / system-generated)
 * Slides down from below the top bar - WhatsApp-style green presentation.
 * API: GET /notifications, PUT /notifications/:id/read, PUT /notifications/read-all
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/app/components/ui/button";
import {
  Bell,
  CreditCard,
  Zap,
  Megaphone,
  AlertCircle,
  ShieldAlert,
  GraduationCap,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import { apiService } from "@/services";
import type { NotificationItem } from "@/services/api";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";

type NotifVisual = "transaction" | "repayment" | "system" | "feature" | "security" | "learning";

const TYPE_ICONS: Record<NotifVisual, typeof CreditCard> = {
  transaction: CreditCard,
  repayment: AlertCircle,
  system: Zap,
  feature: Megaphone,
  security: ShieldAlert,
  learning: GraduationCap,
};

/** Single green family - no blue; accents vary by weight only */
const TYPE_COLORS: Record<NotifVisual, string> = {
  transaction: "bg-emerald-100 text-emerald-800",
  repayment: "bg-emerald-200/90 text-emerald-900",
  system: "bg-emerald-50 text-emerald-700",
  feature: "bg-emerald-100 text-emerald-800",
  security: "bg-emerald-300/50 text-emerald-950",
  learning: "bg-emerald-50 text-emerald-800",
};

function mapBackendType(type: string): NotifVisual {
  switch (type) {
    case "TRANSACTION":
      return "transaction";
    case "LOAN_REMINDER":
    case "DEFAULT_WARNING":
      return "repayment";
    case "KYC_UPDATE":
    case "SYSTEM_ALERT":
      return "system";
    case "PROMOTIONAL":
      return "feature";
    case "SECURITY_ALERT":
      return "security";
    case "LEARNING_NUDGE":
    case "LEARNING_RECOMMENDATION":
      return "learning";
    default:
      return "system";
  }
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function handleActionUrl(
  url: string | null | undefined,
  onNavigate?: (screen: string) => void
): void {
  if (!url || !url.trim()) return;
  const u = url.trim();
  if (u.startsWith("app:")) {
    const screen = u.slice(4);
    if (screen && onNavigate) onNavigate(screen);
    return;
  }
  if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("mailto:")) {
    window.open(u, "_blank", "noopener,noreferrer");
  }
}

interface NotificationsDropdownProps {
  onNavigate?: (screen: string) => void;
}

const HEADER_H = 64;

export function NotificationsDropdown({ onNavigate }: NotificationsDropdownProps) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await apiService.getNotifications({ limit: 50, page: 1 });
    if (!res.success || !res.data) {
      setError(res.message ?? "Could not load notifications");
      setItems([]);
      return;
    }
    setItems(res.data.notifications);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useEffect(() => {
    const id = window.setInterval(() => void load(), 90_000);
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

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

  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  const markOneRead = async (n: NotificationItem) => {
    if (n.isRead) return;
    setMarkingId(n.id);
    const prev = items;
    setItems((list) => list.map((x) => (x.id === n.id ? { ...x, isRead: true, readAt: new Date().toISOString() } : x)));
    const out = await apiService.markNotificationRead(n.id);
    setMarkingId(null);
    if (!out.success) {
      setItems(prev);
      toast.error(out.message ?? "Could not mark as read");
    }
  };

  const markAllRead = async () => {
    const prev = items;
    setItems((list) =>
      list.map((x) => ({ ...x, isRead: true, readAt: x.readAt ?? new Date().toISOString() }))
    );
    const out = await apiService.markAllNotificationsRead();
    if (!out.success) {
      setItems(prev);
      toast.error(out.message ?? "Could not mark all as read");
      return;
    }
    await load();
  };

  const ariaLabel =
    unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : "Notifications, no unread messages";

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
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 id="notifications-panel-title" className="text-lg font-black tracking-tight">
                    Notifications
                  </h3>
                  <p className="text-[11px] font-medium text-emerald-100/95">
                    Updates approved for your account - wallet, credit &amp; security
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-white hover:bg-white/15 hover:text-white"
                    aria-label="Refresh notifications"
                    onClick={() => void load()}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  {unreadCount > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs font-bold text-white hover:bg-white/15"
                      onClick={() => void markAllRead()}
                    >
                      Read all
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-emerald-50/90 to-emerald-100/40">
              {loading && items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-14 text-emerald-800/70">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-hidden />
                  <span className="text-sm font-semibold">Loading…</span>
                </div>
              ) : error ? (
                <div className="space-y-3 p-8 text-center">
                  <p className="text-sm font-medium text-emerald-900/80">{error}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-emerald-300 font-bold text-emerald-800 hover:bg-emerald-100"
                    onClick={() => void load()}
                  >
                    Try again
                  </Button>
                </div>
              ) : items.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm font-bold text-emerald-900">You&apos;re all caught up</p>
                  <p className="mt-1 text-xs font-medium text-emerald-800/70">
                    New messages from FinEra will appear here when your admin or system sends them.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-emerald-200/60 pb-2">
                  {items.map((n) => {
                    const visual = mapBackendType(n.type);
                    const Icon = TYPE_ICONS[visual];
                    const hasAction = Boolean(n.actionUrl?.trim());
                    const actionLabel = n.actionUrl?.trim().startsWith("app:")
                      ? "Open in app"
                      : n.actionUrl && /^(https?:\/\/|mailto:)/i.test(n.actionUrl.trim())
                        ? "View link"
                        : "Open";

                    return (
                      <li
                        key={n.id}
                        className={cn(
                          "px-2 py-1",
                          !n.isRead && "bg-emerald-100/50"
                        )}
                      >
                        <div className="flex items-stretch gap-1 rounded-2xl p-1.5">
                          <button
                            type="button"
                            className={cn(
                              "flex min-w-0 flex-1 items-start gap-3 rounded-xl p-2.5 text-left transition-colors",
                              "hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                            )}
                            onClick={() => void markOneRead(n)}
                            disabled={markingId === n.id}
                          >
                            <div className={cn("mt-0.5 shrink-0 rounded-xl p-2.5 shadow-sm", TYPE_COLORS[visual])}>
                              {markingId === n.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                              ) : (
                                <Icon className="h-4 w-4" aria-hidden />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-bold text-emerald-950">{n.title}</p>
                                {!n.isRead && (
                                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-sm shadow-emerald-600/40" aria-hidden />
                                )}
                              </div>
                              <p className="mt-0.5 line-clamp-4 text-xs leading-relaxed text-emerald-900/80">
                                {n.message}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <p className="text-[10px] font-semibold text-emerald-700/70">
                                  {formatRelativeTime(n.createdAt)}
                                </p>
                                {n.priority === "HIGH" || n.priority === "URGENT" ? (
                                  <span className="rounded-md bg-emerald-200/90 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-950">
                                    {n.priority === "URGENT" ? "Urgent" : "Important"}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </button>
                          {hasAction ? (
                            <button
                              type="button"
                              className="flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-emerald-800 transition-colors hover:bg-emerald-200/60"
                              aria-label={actionLabel}
                              onClick={() => {
                                handleActionUrl(n.actionUrl, onNavigate);
                                setOpen(false);
                              }}
                            >
                              <ExternalLink className="h-5 w-5" aria-hidden />
                            </button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
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
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 rounded-full",
          "border border-emerald-400/35 bg-emerald-500/20 text-white shadow-md shadow-black/20",
          "ring-2 ring-emerald-400/45 ring-offset-2 ring-offset-slate-800",
          "hover:bg-emerald-500/35 hover:text-white hover:ring-emerald-300/55",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
        )}
      >
        <Bell className="h-5 w-5" strokeWidth={2.25} aria-hidden />
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-slate-800 bg-emerald-500 px-1 text-[10px] font-black text-white shadow-sm"
            aria-hidden
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {typeof document !== "undefined" ? createPortal(panel, document.body) : null}
    </>
  );
}
