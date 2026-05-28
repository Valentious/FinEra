/**
 * Global Account Store - Single Source of Truth for wallet/currency context.
 * Prevents state leakage: balance, transactions, and operations are ALWAYS scoped to activeWallet.
 */

import { create } from "zustand";
import type { Wallet } from "@/types/wallet";
import {
  CURRENCY_TO_COUNTRY,
  CURRENCY_LABELS,
  CUSTODY_PROVIDER,
  getWalletLabel,
} from "@/types/wallet";

const STORAGE_KEY = "finera_active_wallet_id";
const DEFAULT_CURRENCY = "USD";

export interface AccountState {
  wallets: Wallet[];
  activeWallet: Wallet | null;
  activeWalletId: string | null;
  isSwitching: boolean;
  isLoading: boolean;
  error: string | null;

  setActiveWallet: (wallet: Wallet) => void;
  setActiveWalletById: (id: string) => void;
  fetchWallets: (fetchFn: () => Promise<Wallet[]>) => Promise<void>;
  setSwitching: (switching: boolean) => void;
  resetToDefault: () => void;
  clearError: () => void;
}

/** Map API response to Wallet interface */
export function toWallet(apiWallet: {
  id: string;
  currencyCode: string;
  accountNumber: string;
  walletNumericId?: string;
  walletLabel?: string;
  savingsBalance?: number;
  balance?: number;
  approvedCreditBalance?: number;
  activeLoanBalance?: number;
  custodyType?: string;
}): Wallet {
  const currency = apiWallet.currencyCode || "USD";
  const bal = apiWallet.balance ?? apiWallet.savingsBalance ?? 0;
  return {
    id: apiWallet.id,
    currency,
    label: CURRENCY_LABELS[currency] ?? `${currency} Account`,
    countryCode: CURRENCY_TO_COUNTRY[currency] ?? "XX",
    provider: CUSTODY_PROVIDER[apiWallet.custodyType as string] ?? "FINERA",
    accountNumber: apiWallet.accountNumber ?? "",
    walletNumericId: apiWallet.walletNumericId,
    balance: bal,
    walletLabel: apiWallet.walletLabel ?? getWalletLabel(currency),
    approvedCreditBalance: apiWallet.approvedCreditBalance ?? 0,
    activeLoanBalance: apiWallet.activeLoanBalance ?? 0,
  };
}

export const useAccountStore = create<AccountState>()((set, get) => ({
  wallets: [],
  activeWallet: null,
  activeWalletId: null,
  isSwitching: false,
  isLoading: true,
  error: null,

  setActiveWallet: (wallet) => {
    set({
      activeWallet: wallet,
      activeWalletId: wallet.id,
      error: null,
    });
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, wallet.id);
    }
  },

  setActiveWalletById: (id) => {
    const { wallets } = get();
    const w = wallets.find((x) => x.id === id);
    if (w) {
      get().setActiveWallet(w);
    }
  },

  fetchWallets: async (fetchFn) => {
    set({ isLoading: true, error: null });
    try {
      const list = await fetchFn();
      const savedId =
        typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;

      let active: Wallet | null =
        list.find((w) => w.id === savedId) ?? list[0] ?? null;

      if (!active && list.length > 0) {
        active = list.find((w) => w.currency === DEFAULT_CURRENCY) ?? list[0];
      }

      set({
        wallets: list,
        activeWallet: active,
        activeWalletId: active?.id ?? null,
        isLoading: false,
      });

      if (active && typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, active.id);
      }
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to load wallets",
        isLoading: false,
        wallets: [],
        activeWallet: null,
        activeWalletId: null,
      });
    }
  },

  setSwitching: (switching) => set({ isSwitching: switching }),

  resetToDefault: () => {
    const { wallets } = get();
    const usd =
      wallets.find((w) => w.currency === DEFAULT_CURRENCY) ?? wallets[0];
    if (usd) {
      get().setActiveWallet(usd);
    }
    set({ error: null });
  },

  clearError: () => set({ error: null }),
}));
