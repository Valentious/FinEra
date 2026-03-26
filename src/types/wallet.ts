/**
 * Strict Wallet interface for fintech account isolation.
 * Future-proof: use wallet id for API calls (users may have multiple accounts per currency).
 */

export interface Wallet {
  id: string;
  currency: string;
  label: string;
  countryCode: string;
  provider: string;
  accountNumber: string;
  savingsBalance: number;
  balance: number;
  approvedCreditBalance: number;
  activeLoanBalance: number;
}

/** Currency → country code for flag/country mapping */
export const CURRENCY_TO_COUNTRY: Record<string, string> = {
  USD: "US",
  ZIG: "ZW",
  ZAR: "ZA",
  EUR: "EU",
  GBP: "GB",
};

/** Currency → display label (ZiG = Zimbabwe Gold) */
export const CURRENCY_LABELS: Record<string, string> = {
  USD: "USD Account",
  ZIG: "ZiG Account",
  ZAR: "ZAR Account",
  EUR: "EUR Account",
  GBP: "GBP Account",
};

/** Custody type → provider display name */
export const CUSTODY_PROVIDER: Record<string, string> = {
  bank: "Bank custody",
  momo: "Mobile money",
  blockchain: "Blockchain custody",
};

/** Country code → flag emoji (regional indicators) */
export const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸",
  ZW: "🇿🇼",
  ZA: "🇿🇦",
  EU: "🇪🇺",
  GB: "🇬🇧",
  XX: "💳",
};

export function getFlag(countryCode: string): string {
  return COUNTRY_FLAGS[countryCode] ?? "💳";
}
