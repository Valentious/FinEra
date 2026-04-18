/**
 * Global Account Switcher - Production-grade fintech control.
 * Enforces strict currency isolation. Zero state leakage.
 */

import { ChevronDown, Plus, Wallet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";
import { useAccountStore } from "@/stores/accountStore";
import { getFlag } from "@/types/wallet";
import { cn } from "@/app/components/ui/utils";

interface GlobalAccountSwitcherProps {
  onCreateWallet?: () => void;
  variant?: "default" | "header";
}

export function GlobalAccountSwitcher({
  onCreateWallet,
  variant = "default",
}: GlobalAccountSwitcherProps) {
  const {
    wallets,
    activeWallet,
    isLoading,
    setActiveWallet,
    setSwitching,
  } = useAccountStore();

  const handleSelect = async (wallet: (typeof wallets)[0]) => {
    if (wallet.id === activeWallet?.id) return;
    setSwitching(true);
    setActiveWallet(wallet);
    setTimeout(() => setSwitching(false), 200);
  };

  const triggerClass =
    variant === "header"
      ? "min-w-[160px] justify-between border-slate-500/60 bg-slate-700/80 text-white hover:bg-slate-600/80 font-semibold"
      : "min-w-[180px] justify-between border-slate-300/60 bg-white/95 font-semibold hover:bg-slate-50";

  return (
    <div className="flex flex-col gap-0.5">
      <label
        className={cn(
          "text-[10px] font-bold uppercase tracking-wider",
          variant === "header" ? "text-muted-foreground" : "text-muted-foreground"
        )}
      >
        Choose your preferred account
      </label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={cn("border transition-opacity duration-200 ease-in-out", triggerClass)}>
            <span className="flex items-center gap-2">
              <span className="text-base">
                {activeWallet ? getFlag(activeWallet.countryCode) : "💳"}
              </span>
              <span>
                {activeWallet
                  ? `${activeWallet.label} • ${activeWallet.currency}`
                  : isLoading
                    ? "Loading..."
                    : "No account"}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[240px]">
          {wallets.length === 0 && !isLoading ? (
            <div className="px-3 py-4 text-center">
              <Wallet className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                Create your first wallet
              </p>
              {onCreateWallet && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    onCreateWallet();
                  }}
                  className="mt-2 cursor-pointer justify-center gap-1 text-emerald-600 font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Wallet
                </DropdownMenuItem>
              )}
            </div>
          ) : (
            wallets.map((w) => {
              const isActive = w.id === activeWallet?.id;
              return (
                <DropdownMenuItem
                  key={w.id}
                  onSelect={() => handleSelect(w)}
                  className={cn(
                    "cursor-pointer py-2.5 transition-opacity duration-200 ease-in-out hover:bg-slate-50 focus:bg-slate-50",
                    isActive && "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:bg-emerald-100"
                  )}
                >
                  <div className="flex flex-col gap-0.5 w-full">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">{getFlag(w.countryCode)}</span>
                      <span className="font-medium">{w.label}</span>
                      <span className="text-muted-foreground text-xs">{w.currency}</span>
                      {isActive && (
                        <span className="ml-auto text-[10px] font-bold text-emerald-600">
                          Active
                        </span>
                      )}
                    </span>
                    {!w.accountNumber ? (
                      <span className="text-[10px] text-muted-foreground pl-7">
                        Connected to: {w.provider}
                      </span>
                    ) : null}
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
