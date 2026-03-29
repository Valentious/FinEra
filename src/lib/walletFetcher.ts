/**
 * Fetches wallets from API and maps to Wallet[] for account store.
 * When API returns empty, seeds with default FinCash accounts from getCurrencies (scalable).
 */

import apiService from "@/services/index";
import { toWallet } from "@/stores/accountStore";
import type { Wallet } from "@/types/wallet";
import { CURRENCY_LABELS, CURRENCY_TO_COUNTRY, getWalletLabel } from "@/types/wallet";

/** Build default FinCash accounts from available currencies (scalable) */
function buildDefaultWallets(currencies: { currencyCode: string }[]): Wallet[] {
  const supported = currencies.length > 0 ? currencies : [
    { currencyCode: "USD" },
    { currencyCode: "ZIG" },
    { currencyCode: "ZAR" },
  ];
  return supported.map((c) => {
    const cc = c.currencyCode.toUpperCase();
    return {
      id: `finera-${cc.toLowerCase()}`,
      currency: cc,
      label: CURRENCY_LABELS[cc] ?? `${cc} Account`,
      countryCode: CURRENCY_TO_COUNTRY[cc] ?? "XX",
      provider: "FinCash",
      accountNumber: "",
      balance: 0,
      walletLabel: getWalletLabel(cc),
      approvedCreditBalance: 0,
      activeLoanBalance: 0,
    };
  });
}

export async function fetchWalletsForStore(): Promise<Wallet[]> {
  const raw = await apiService.getWalletsByCurrency();
  const fromApi = raw.map((w) =>
    toWallet({
      id: w.id,
      currencyCode: w.currencyCode,
      accountNumber: w.accountNumber,
      balance: w.balance,
      walletLabel: w.walletLabel ?? getWalletLabel(w.currencyCode),
      approvedCreditBalance: w.approvedCreditBalance,
      activeLoanBalance: w.activeLoanBalance,
    })
  );
  if (fromApi.length > 0) return fromApi;
  // Scalable fallback: use getCurrencies so USD, ZiG, ZAR, etc. all appear
  const currencies = await apiService.getCurrencies?.().catch(() => []) ?? [];
  return buildDefaultWallets(currencies);
}
