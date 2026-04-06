import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";
import { useState } from "react";
import type { IsoCurrency } from "../components/CurrencyTag";
import { DashboardTrustRibbon } from "@/app/components/DashboardTrustRibbon";

type Props = {
  wsConnected: boolean;
  onLogout: () => void;
};

export function AdminLayout({ wsConnected, onLogout }: Props) {
  const [currency, setCurrency] = useState<IsoCurrency>("USD");
  return (
    <>
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopBar
            currency={currency}
            onCurrencyChange={(c) => setCurrency(c)}
            wsConnected={wsConnected}
            onLogout={onLogout}
          />
          <main className="flex-1 overflow-auto p-6 pb-[max(2rem,calc(3.25rem+env(safe-area-inset-bottom,0px)))]">
            <Outlet context={{ currency }} />
          </main>
        </div>
      </div>
      <DashboardTrustRibbon insetForSidebar sidebarInsetClassName="md:left-56" />
    </>
  );
}
