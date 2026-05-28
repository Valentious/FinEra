import { NavLink } from "react-router-dom";
import { adminColors, type AdminNavId } from "../design-system/tokens";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Brain,
  FileStack,
  Shield,
  Activity,
  ArrowLeftRight,
  ScrollText,
  Settings,
} from "lucide-react";

const items: { id: AdminNavId; to: string; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", to: ".", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", to: "users", label: "Users", icon: Users },
  { id: "wallets", to: "wallets", label: "Wallets", icon: Wallet },
  { id: "credit", to: "credit-intelligence", label: "Credit Intelligence", icon: Brain },
  { id: "documents", to: "documents", label: "Document compliance", icon: FileStack },
  { id: "agents", to: "agent-governance", label: "Agent Governance (FVAR)", icon: Shield },
  { id: "risk", to: "risk-monitor", label: "Risk Monitor", icon: Activity },
  { id: "transactions", to: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { id: "audit", to: "audit-logs", label: "Audit Logs", icon: ScrollText },
  { id: "settings", to: "settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  return (
    <aside
      className="flex w-56 shrink-0 flex-col border-r bg-white py-6"
      style={{ borderColor: adminColors.border }}
    >
      <div className="px-4 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: adminColors.textMuted }}>
          FinEra Admin
        </p>
        <p className="text-sm font-bold" style={{ color: adminColors.text }}>
          Oversight Console
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.id === "dashboard"}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-slate-900 text-white" : "text-foreground hover:bg-slate-100"
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
