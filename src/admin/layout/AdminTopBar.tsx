import { Wifi, WifiOff, ShieldCheck } from "lucide-react";
import { CurrencyTag, type IsoCurrency } from "../components/CurrencyTag";
import { adminColors } from "../design-system/tokens";

type Props = {
  currency: IsoCurrency;
  onCurrencyChange: (c: IsoCurrency) => void;
  wsConnected: boolean;
  onLogout: () => void;
};

export function AdminTopBar({ currency, onCurrencyChange, wsConnected, onLogout }: Props) {
  const currencies: IsoCurrency[] = ["USD", "ZIG", "ZAR"];
  return (
    <header
      className="flex h-14 items-center justify-between border-b bg-white px-6"
      style={{ borderColor: adminColors.border }}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Currency context</span>
        <div className="flex gap-1">
          {currencies.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onCurrencyChange(c)}
              className={`rounded border px-2 py-1 transition ${currency === c ? "border-slate-900 ring-1 ring-slate-900" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              <CurrencyTag code={c} />
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs" title="WebSocket status">
          {wsConnected ? (
            <>
              <Wifi className="h-4 w-4 text-emerald-600" />
              <span className="text-emerald-700">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-amber-600" />
              <span className="text-amber-700">Polling fallback</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          RBAC enforced server-side
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
