import { useMemo } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { CheckCircle2, Copy, User, Phone, Wallet, Sparkles, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { FinEraLogo } from "@/app/components/FinEraLogo";

/** Currencies we show Wallet IDs for (same order as dashboard tabs where applicable). */
const WALLET_ID_CURRENCY_ORDER = ["USD", "ZIG"] as const;

const CURRENCY_LABELS: Record<string, string> = {
  USD: "US Dollar",
  ZIG: "ZiG",
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
  /** Optional secondary action for onboarding flows that require extra checks. */
  onCompleteVerification?: () => void;
}

export function AccountCreationSuccess({
  fullName,
  phoneNumber,
  walletNumericIds,
  onContinue,
  onCompleteVerification,
}: AccountCreationSuccessProps) {
  const walletRows = useMemo(() => normalizeWalletIds(walletNumericIds), [walletNumericIds]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-whatsapp-green-light to-whatsapp-green px-4 py-8 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_70%_at_15%_5%,rgba(255,255,255,0.26)_0%,transparent_55%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_95%_55%_at_88%_92%,rgba(5,150,105,0.18)_0%,transparent_50%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-black/6" aria-hidden />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-center"
      >
        <Card className="w-full rounded-3xl border border-white/35 bg-white/85 shadow-[0_20px_48px_rgba(15,23,42,0.18)] backdrop-blur-xl">
          <CardContent className="space-y-7 p-5 sm:p-8 md:p-10">
            <div className="flex flex-col items-center text-center">
              <FinEraLogo size="md" showTagline={false} className="h-auto w-[10.5rem] sm:w-[12rem]" />

              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.08, duration: 0.4 }}
                className="relative mt-5"
              >
                <motion.div
                  animate={{ opacity: [0.28, 0.56, 0.28], scale: [1, 1.07, 1] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.4, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-emerald-400/35 blur-xl"
                  aria-hidden
                />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200/70 bg-emerald-100/85 shadow-inner">
                  <CheckCircle2 className="h-8 w-8 text-emerald-700" />
                </div>
              </motion.div>

                <h1 className="mt-5 text-balance text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Account Successfully Created
              </h1>
                <p className="mt-2 max-w-xl text-balance text-sm leading-relaxed text-slate-700 sm:text-base">
                Your FinEra account is now ready. Secure access to inclusive financial services has been activated.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/18 bg-white/80 p-4 shadow-sm dark:bg-white/10">
                <div className="mb-1.5 flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-600" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Account holder</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-extrabold text-slate-900">{fullName}</p>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => copyToClipboard(fullName, "Name")}>
                    <Copy className="h-4 w-4 text-slate-500" />
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border border-white/18 bg-white/80 p-4 shadow-sm dark:bg-white/10">
                <div className="mb-1.5 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Linked phone</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-extrabold text-slate-900">{phoneNumber}</p>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => copyToClipboard(phoneNumber, "Phone Number")}>
                    <Copy className="h-4 w-4 text-slate-500" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/18 bg-white/85 p-4 sm:p-5 dark:bg-white/10">
              <div className="mb-3 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-600" />
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Wallet IDs</p>
              </div>
              {walletRows.length > 0 ? (
                <ul className="space-y-2.5">
                  {walletRows.map((row) => (
                    <li key={row.code} className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white px-3 py-2.5">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          {row.code} · {row.label}
                        </p>
                        <p className="font-mono text-sm font-black tracking-[0.08em] text-emerald-700">{row.id}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => copyToClipboard(row.id, `${row.code} Wallet ID`)}
                        aria-label={`Copy ${row.code} Wallet ID`}
                      >
                        <Copy className="h-4 w-4 text-slate-500" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600">
                  Wallet IDs will appear once wallet sync completes.
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                onClick={onContinue}
                className="h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-base font-black text-white shadow-[0_10px_28px_rgba(16,185,129,0.35)] transition-all hover:translate-y-[-1px] hover:from-emerald-500 hover:to-teal-500"
              >
                Continue to Dashboard
              </Button>
              {onCompleteVerification ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCompleteVerification}
                  className="h-12 rounded-xl border-slate-300 bg-white text-base font-bold text-slate-800 backdrop-blur-sm transition-all hover:bg-slate-100"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Complete Verification
                </Button>
              ) : (
                <div className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-center text-xs font-medium text-slate-700">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Onboarding complete
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
