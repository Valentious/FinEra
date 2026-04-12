import { useMemo } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { CheckCircle2, Copy, User, Phone, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

/** Currencies we show Wallet IDs for (same order as dashboard tabs where applicable). */
const WALLET_ID_CURRENCY_ORDER = ["USD", "ZIG", "ZAR", "EUR", "GBP"] as const;

const CURRENCY_LABELS: Record<string, string> = {
  USD: "US Dollar",
  ZIG: "ZiG",
  ZAR: "South African Rand",
  EUR: "Euro",
  GBP: "British Pound",
};

function normalizeWalletIds(
  ids: Partial<Record<string, string>> | undefined
): { code: string; label: string; id: string }[] {
  if (!ids || typeof ids !== "object") return [];
  const out: { code: string; label: string; id: string }[] = [];
  for (const code of WALLET_ID_CURRENCY_ORDER) {
    const raw = ids[code] ?? ids[code as keyof typeof ids];
    const id = typeof raw === "string" ? raw.trim() : "";
    if (/^\d{10}$/.test(id)) {
      out.push({
        code,
        label: CURRENCY_LABELS[code] ?? code,
        id,
      });
    }
  }
  return out;
}

interface AccountCreationSuccessProps {
  fullName: string;
  phoneNumber: string;
  /** Per-currency 10-digit Wallet IDs (Binance-style), same as dashboard / peer transfer. */
  walletNumericIds?: Partial<Record<string, string>>;
  onContinue: () => void;
}

export function AccountCreationSuccess({
  fullName,
  phoneNumber,
  walletNumericIds,
  onContinue,
}: AccountCreationSuccessProps) {
  const walletRows = useMemo(() => normalizeWalletIds(walletNumericIds), [walletNumericIds]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4 sm:p-6 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-2xl"
      >
        <Card className="border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-black/40 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white pt-10 pb-8 px-6 sm:px-10">
            <div className="flex flex-col items-center text-center max-w-xl mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.12, type: "spring", stiffness: 220 }}
                className="mb-5"
              >
                <div className="p-5 bg-white/20 backdrop-blur-sm rounded-full ring-1 ring-white/30">
                  <CheckCircle2 className="w-16 h-16 text-white" />
                </div>
              </motion.div>
              <CardTitle className="text-2xl sm:text-3xl font-black mb-2 tracking-tight">
                Account Successfully Created
              </CardTitle>
              <p className="text-base sm:text-lg font-medium text-white/95">
                Welcome to FinEra INCLUSIVE CREDIT
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 lg:p-10 space-y-6">
            <div className="bg-gradient-to-br from-emerald-50/90 to-white dark:from-emerald-950/30 dark:to-slate-900 rounded-2xl p-6 sm:p-7 border border-emerald-100 dark:border-emerald-900/60 shadow-sm">
              <h3 className="text-xs font-black text-muted-foreground mb-5 text-center uppercase tracking-[0.2em]">
                Your account
              </h3>

              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl shrink-0">
                        <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                          Account holder
                        </p>
                        <p className="text-base font-black text-foreground truncate">{fullName}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(fullName, "Name")}
                      className="h-9 w-9 p-0 shrink-0"
                      aria-label="Copy name"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-emerald-200/90 dark:border-emerald-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-emerald-100 dark:border-emerald-900/80 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <p className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                      Wallet IDs (per currency)
                    </p>
                  </div>
                  <div className="p-1">
                    {walletRows.length > 0 ? (
                      <ul className="divide-y divide-emerald-100/80 dark:divide-emerald-900/50">
                        {walletRows.map((row) => (
                          <li
                            key={row.code}
                            className="flex items-center justify-between gap-3 px-3 py-3.5 sm:px-4 rounded-lg hover:bg-emerald-50/40 dark:hover:bg-emerald-950/15 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                                {row.code} · {row.label}
                              </p>
                              <p className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300 tracking-wider font-mono mt-0.5">
                                {row.id}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(row.id, `${row.code} Wallet ID`)}
                              className="h-9 w-9 p-0 shrink-0"
                              aria-label={`Copy ${row.code} Wallet ID`}
                            >
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed">
                          Your per-currency Wallet IDs will appear here and on the dashboard once wallets are synced.
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground px-4 pb-4 leading-relaxed">
                    Each currency has its own 10-digit ID for peer transfers. Use the ID that matches the wallet you are
                    sending to or receiving in.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl shrink-0">
                        <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                          Linked phone
                        </p>
                        <p className="text-base font-black text-foreground">{phoneNumber}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(phoneNumber, "Phone Number")}
                      className="h-9 w-9 p-0 shrink-0"
                      aria-label="Copy phone"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-amber-50 dark:bg-amber-950/25 rounded-xl p-4 border border-amber-200/90 dark:border-amber-900">
                <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 mb-1.5">Account purpose</h4>
                <p className="text-xs text-amber-900/90 dark:text-amber-100/90 leading-relaxed">
                  Your Wallet IDs identify you for transfers and support. Fund your FinCash wallets for savings, loans,
                  and repayments in FinEra Inclusive Credit.
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/25 rounded-xl p-4 border border-emerald-200/90 dark:border-emerald-900">
                <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-200 mb-1.5">Security</h4>
                <p className="text-xs text-emerald-900/90 dark:text-emerald-100/90 leading-relaxed">
                  Never share your password. FinEra staff will never ask for your password by email or phone.
                </p>
              </div>
            </div>

            <Button
              onClick={onContinue}
              className="w-full h-14 bg-gradient-to-r from-emerald-600 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 text-white rounded-xl font-black text-base sm:text-lg shadow-lg shadow-emerald-600/20 active:scale-[0.99] transition-all"
            >
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
