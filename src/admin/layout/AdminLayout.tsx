import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";
import { useState } from "react";
import type { IsoCurrency } from "../components/CurrencyTag";

type Props = {
  wsConnected: boolean;
  onLogout: () => void;
};

export function AdminLayout({ wsConnected, onLogout }: Props) {
  const [currency, setCurrency] = useState<IsoCurrency>("USD");
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar
          currency={currency}
          onCurrencyChange={(c) => setCurrency(c)}
          wsConnected={wsConnected}
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-auto p-6">
          <Outlet context={{ currency }} />
        </main>
      </div>
    </div>
  );
}
