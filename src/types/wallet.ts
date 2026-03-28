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

/** Prefix/symbol shown before amounts (ZiG uses code, not $) */
export const CURRENCY_AMOUNT_SYMBOLS: Record<string, string> = {
  USD: "$",
  ZIG: "ZiG",
  ZAR: "R",
  EUR: "€",
  GBP: "£",
};

/** Placeholder for amount inputs per dashboard */
export function currencyAmountPlaceholder(currency: string): string {
  const c = currency.toUpperCase();
  if (c === "USD") return "Enter amount ($)";
  if (c === "ZIG") return "Enter amount (ZiG)";
  if (c === "ZAR") return "Enter amount (R)";
  if (c === "EUR") return "Enter amount (€)";
  if (c === "GBP") return "Enter amount (£)";
  return `Enter amount (${c})`;
}

/**
 * Format an amount for display using ISO currency code (single source of truth for credit UI).
 * USD → $1,234  |  ZAR → R 1,234  |  ZiG → ZiG 1,234
 */
export function formatAmountWithCurrency(amount: number, currency: string): string {
  const c = currency.toUpperCase();
  switch (c) {
    case "USD":
      return `$${amount.toLocaleString()}`;
    case "ZAR":
      return `R ${amount.toLocaleString()}`;
    case "ZIG":
      return `ZiG ${amount.toLocaleString()}`;
    case "EUR":
      return `€${amount.toLocaleString()}`;
    case "GBP":
      return `£${amount.toLocaleString()}`;
    default:
      return `${amount.toLocaleString()} (${c})`;
  }
}

/** Format a numeric amount with a display symbol (legacy / non-ISO callers). */
export function formatAmountWithSymbol(symbol: string, amount: number): string {
  const bySymbol: Record<string, string> = {
    $: "USD",
    ZiG: "ZIG",
    R: "ZAR",
    "€": "EUR",
    "£": "GBP",
  };
  const code = bySymbol[symbol];
  if (code) return formatAmountWithCurrency(amount, code);
  if (symbol === "ZiG") return formatAmountWithCurrency(amount, "ZIG");
  return `${symbol}${amount.toLocaleString()}`;
}
