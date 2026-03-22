/**
 * useActiveApi - The Filter Layer
 * Guarantees all API calls include activeWalletId or currency context.
 * NEVER forget the currency parameter.
 */

import { useCallback } from "react";
import { useAccountStore } from "@/stores/accountStore";
import apiService from "@/services/index";

export function useActiveApi() {
  const activeWallet = useAccountStore((s) => s.activeWallet);

  const currency = activeWallet?.currency ?? "USD";
  const walletId = activeWallet?.id ?? null;

  /** Get user profile scoped to active wallet currency */
  const getUserProfile = useCallback(async () => {
    return apiService.getUserProfile(currency);
  }, [currency]);

  /** Get transactions scoped to active wallet currency */
  const getTransactionsByCurrency = useCallback(
    async (params?: { page?: number; limit?: number }) => {
      return apiService.getTransactionsByCurrency(currency, params);
    },
    [currency]
  );

  /** Get wallets - optionally filtered by active currency (returns all if no filter) */
  const getWalletsByCurrency = useCallback(
    async (filterCurrency?: string) => {
      return apiService.getWalletsByCurrency(filterCurrency ?? currency);
    },
    [currency]
  );

  /** Deposit - always uses active currency */
  const depositFunds = useCallback(
    (data: { amount: number; method?: string; purpose?: string }) => {
      return apiService.depositFunds({
        ...data,
        currency,
      });
    },
    [currency]
  );

  /** Withdraw - always uses active currency */
  const withdrawFunds = useCallback(
    (data: { amount: number; method: string; destination?: string }) => {
      return apiService.withdrawFunds({
        ...data,
        currency,
      });
    },
    [currency]
  );

  /** Transfer credit to savings - always uses active currency */
  const transferCreditToSavings = useCallback(
    (amount: number) => {
      return apiService.transferCreditToSavings(amount, currency);
    },
    [currency]
  );

  /** Make repayment - always uses active currency */
  const makeRepayment = useCallback(
    (data: { amount: number; method: string }) => {
      return apiService.makeRepayment({
        ...data,
        currency,
      });
    },
    [currency]
  );

  /** Apply for credit - always uses active currency */
  const applyCreditApplication = useCallback(
    (data: { creditType: string; amount: number; withCollateral?: boolean }) => {
      return apiService.applyCreditApplication({
        ...data,
        currency,
      });
    },
    [currency]
  );

  return {
    currency,
    walletId,
    activeWallet,
    getUserProfile,
    getTransactionsByCurrency,
    getWalletsByCurrency,
    depositFunds,
    withdrawFunds,
    transferCreditToSavings,
    makeRepayment,
    applyCreditApplication,
  };
}
