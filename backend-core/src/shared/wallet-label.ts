/**
 * Normalize dashboard / API currency codes (ZiG, zig, ZIG → ZIG).
 */
export function normalizeCurrencyCode(currency: string): string {
  const t = currency.trim();
  if (!t) return "";
  return t.toUpperCase();
}

/**
 * Human-readable FinCash wallet name per dashboard / ledger currency.
 * Must stay aligned with frontend `getWalletLabel` (same strings).
 * USD → FinEra USD Wallet | ZiG (ZIG) → FinCash ZiG Wallet | ZAR → FinCash ZAR Wallet
 */
export function getWalletLabel(currency: string): string {
  const c = normalizeCurrencyCode(currency);
  switch (c) {
    case "USD":
      return "FinEra USD Wallet";
    case "ZIG":
      return "FinCash ZiG Wallet";
    case "ZAR":
      return "FinCash ZAR Wallet";
    default:
      return "FinCash Wallet";
  }
}
