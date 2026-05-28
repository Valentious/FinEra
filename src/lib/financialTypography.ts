/**
 * Shared classes for monetary figures - tabular lining numerals, mono stack, tight tracking.
 * Pair with `formatAmountWithCurrency` / `formatAmountWithSymbol` from `@/types/wallet`.
 */
export const finAmountHero = "fin-amount fin-amount--hero tabular-nums tracking-tight";

/** Card-sized primary balances (FINERA, loan principal). */
export const finAmountPrimary = "fin-amount fin-amount--primary tabular-nums tracking-tight";

/** Inline / secondary money (fees, subtitles). */
export const finAmountSecondary = "fin-amount fin-amount--secondary tabular-nums tracking-tight";

/** Ledger rows, tables, CSV-friendly density. */
export const finAmountLedger = "fin-amount fin-amount--ledger tabular-nums tracking-tight";
