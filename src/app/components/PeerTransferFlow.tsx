import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { ArrowLeft, CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { apiService } from "@/services/index";
import { useI18n } from "@/app/providers/I18nProvider";
import {
  CURRENCY_AMOUNT_SYMBOLS,
  formatAmountWithCurrency,
} from "@/types/wallet";

type Step = "recipient" | "amount" | "confirm" | "success";

export interface PeerTransferFlowProps {
  currency: string;
  availableBalance: number;
  onBack: () => void;
  onSuccess: () => void | Promise<void>;
}

export function PeerTransferFlow({
  currency,
  availableBalance,
  onBack,
  onSuccess,
}: PeerTransferFlowProps) {
  const { t } = useI18n();
  const cc = (currency || "USD").toUpperCase();
  const symbol = CURRENCY_AMOUNT_SYMBOLS[cc] ?? cc + " ";

  const [step, setStep] = useState<Step>("recipient");
  const [accountNumber, setAccountNumber] = useState("");
  const [toUserId, setToUserId] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [walletLabel, setWalletLabel] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState("");

  const parseAmount = (): number => {
    const n = parseFloat(amountStr.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : NaN;
  };

  const handleLookup = async () => {
    const acc = accountNumber.replace(/\D/g, "").slice(0, 10);
    if (acc.length !== 10) {
      toast.error(t("transfer.walletIdInvalid", { currency: cc }));
      return;
    }
    setLoading(true);
    try {
      const r = await apiService.getPeerRecipient(acc);
      if (r.currencyCode.toUpperCase() !== cc) {
        toast.error(t("transfer.currencyMismatch"));
        return;
      }
      setToUserId(r.userId);
      setHint(r.displayNameHint);
      setWalletLabel(r.walletLabel);
      setStep("amount");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const goConfirm = () => {
    const amt = parseAmount();
    if (!Number.isFinite(amt) || amt <= 0 || amt > availableBalance) {
      toast.error(t("transfer.invalidAmount"));
      return;
    }
    setStep("confirm");
  };

  const handleSend = async () => {
    if (!toUserId) return;
    const amt = parseAmount();
    if (!Number.isFinite(amt) || amt <= 0 || amt > availableBalance) {
      toast.error(t("transfer.invalidAmount"));
      return;
    }
    setLoading(true);
    try {
      const ref = `P2P-${cc}-${Date.now().toString(36)}`;
      const res = await apiService.peerTransfer({
        toUserId,
        amount: amt,
        currency: cc,
        referenceId: ref,
      });
      setReference(res.reference || ref);
      await onSuccess();
      setStep("success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-foreground">{t("transfer.title")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t("transfer.subtitle", { currency: cc })}</p>
        </div>
      </div>

      <div className="flex gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
        <span className={step === "recipient" ? "text-emerald-600" : ""}>1 {t("transfer.recipientStep")}</span>
        <span>→</span>
        <span className={step === "amount" || step === "confirm" ? "text-emerald-600" : ""}>2 {t("transfer.amountStep")}</span>
        <span>→</span>
        <span className={step === "confirm" || step === "success" ? "text-emerald-600" : ""}>3 {t("transfer.confirmStep")}</span>
      </div>

      {step === "recipient" && (
        <Card className="p-6 border-slate-100 shadow-xl">
          <div className="space-y-4">
            <div>
              <Label>{t("transfer.walletIdLabel", { currency: cc })}</Label>
              <Input
                className="mt-1 h-12 rounded-xl font-mono text-lg tracking-widest"
                placeholder={t("transfer.walletIdPlaceholder")}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
              />
            </div>
            <Button
              className="w-full h-12 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700"
              onClick={handleLookup}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("transfer.lookup")}
            </Button>
          </div>
        </Card>
      )}

      {step === "amount" && toUserId && (
        <Card className="p-6 border-slate-100 shadow-xl space-y-4">
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-100 dark:border-emerald-900">
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">{t("transfer.recipientOk")}</p>
            <p className="text-sm font-black text-foreground mt-1">{hint}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("transfer.walletLabel")}: {walletLabel}
            </p>
          </div>
          <div>
            <Label>{t("transfer.amountLabel")}</Label>
            <Input
              type="text"
              inputMode="decimal"
              className="mt-1 h-12 rounded-xl text-lg font-black"
              placeholder="0.00"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {t("transfer.available")}: {formatAmountWithCurrency(availableBalance, cc)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep("recipient")}>
              {t("common.back")}
            </Button>
            <Button className="flex-1 rounded-xl font-black bg-emerald-600" onClick={goConfirm}>
              {t("transfer.review")}
            </Button>
          </div>
        </Card>
      )}

      {step === "confirm" && toUserId && (
        <Card className="p-6 border-slate-100 shadow-xl space-y-4">
          <h3 className="font-black text-lg">{t("transfer.review")}</h3>
          <ul className="text-sm space-y-2 text-foreground dark:text-muted-foreground">
            <li className="flex justify-between">
              <span>{t("transfer.nameHint")}</span>
              <span className="font-bold">{hint}</span>
            </li>
            <li className="flex justify-between">
              <span>{t("transfer.amountLabel")}</span>
              <span className="font-black">
                {symbol}
                {parseAmount().toFixed(2)}
              </span>
            </li>
            <li className="flex justify-between text-xs text-muted-foreground">
              <span>{t("transfer.walletLabel")}</span>
              <span>{walletLabel}</span>
            </li>
          </ul>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep("amount")} disabled={loading}>
              {t("common.back")}
            </Button>
            <Button
              className="flex-1 rounded-xl font-black bg-emerald-600 gap-2"
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
              {t("transfer.send")}
            </Button>
          </div>
        </Card>
      )}

      {step === "success" && (
        <Card className="p-8 border-emerald-100 shadow-xl text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
          <h2 className="text-xl font-black text-foreground">{t("transfer.success")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("transfer.reference")}: <span className="font-mono font-bold">{reference}</span>
          </p>
          <Button className="w-full rounded-xl font-black bg-slate-900 text-white dark:bg-emerald-600" onClick={onBack}>
            {t("common.ok")}
          </Button>
        </Card>
      )}
    </div>
  );
}
