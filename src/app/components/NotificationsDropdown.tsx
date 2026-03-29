/**
 * FinEra - Notification Center
 * Transaction, system, feature updates, loan repayment reminders
 * GET /api/notifications
 */

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";
import { Bell, CreditCard, Zap, Megaphone, AlertCircle } from "lucide-react";
import { cn } from "@/app/components/ui/utils";

type NotifType = "transaction" | "system" | "feature" | "repayment";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

const TYPE_ICONS: Record<NotifType, typeof CreditCard> = {
  transaction: CreditCard,
  system: Zap,
  feature: Megaphone,
  repayment: AlertCircle,
};

const TYPE_COLORS: Record<NotifType, string> = {
  transaction: "bg-emerald-50 text-emerald-600",
  system: "bg-amber-50 text-amber-600",
  feature: "bg-blue-50 text-blue-600",
  repayment: "bg-red-50 text-red-600",
};

// Mock data - replace with GET /api/notifications
const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "1", type: "transaction", title: "Cash In Confirmed", message: "Your cash in of $500 has been credited.", date: new Date().toISOString(), read: false },
  { id: "2", type: "repayment", title: "Loan Repayment Reminder", message: "Your next payment of $120 is due in 7 days (D-7).", date: new Date().toISOString(), read: false },
  { id: "3", type: "feature", title: "New Payment Method", message: "EcoCash and OneMoney are now available for cash in.", date: new Date().toISOString(), read: true },
  { id: "4", type: "system", title: "Scheduled Maintenance", message: "Platform maintenance on March 20, 2:00 AM - 4:00 AM.", date: new Date().toISOString(), read: true },
];

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-200 hover:text-white hover:bg-white/10">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-slate-800">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] max-h-[400px] overflow-y-auto p-0">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-600" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No notifications</div>
          ) : (
            notifications.map((n) => {
              const Icon = TYPE_ICONS[n.type];
              return (
                <button
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0",
                    !n.read && "bg-emerald-50/30"
                  )}
                >
                  <div className={cn("p-2 rounded-lg shrink-0", TYPE_COLORS[n.type])}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm">{n.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.date).toLocaleDateString()}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
