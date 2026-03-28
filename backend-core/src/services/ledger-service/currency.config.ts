/**
 * FinEra - Currency Configuration (DYNAMIC)
 *
 * NO hardcoded currencies. Active currencies are loaded from CurrencyRegistry.
 * New currencies can be added without code changes - just add to DB.
 */

import { prisma } from "../../infrastructure/database/index.js";
import type { CurrencyCode } from "@prisma/client";
import { validationError } from "../../middlewares/errorHandler.js";

let _cache: CurrencyCode[] | null = null;
let _cacheTs = 0;
const CACHE_TTL_MS = 60_000; // 1 min

/**
 * Get active currency codes from CurrencyRegistry.
 * Cached to avoid DB hit on every request.
 */
export async function getActiveCurrencies(): Promise<CurrencyCode[]> {
  if (_cache && Date.now() - _cacheTs < CACHE_TTL_MS) return _cache;
  const rows = await prisma.currencyRegistry.findMany({
    where: { status: "active" },
    select: { currencyCode: true },
  });
  _cache = rows.map((r) => r.currencyCode);
  _cacheTs = Date.now();
  return _cache;
}

/**
 * Check if currency is active/supported.
 */
export async function isCurrencyActive(currency: CurrencyCode): Promise<boolean> {
  const active = await getActiveCurrencies();
  return active.includes(currency);
}

/**
 * Validate currency - throws if not active.
 */
export async function validateCurrencyActive(currency: CurrencyCode): Promise<void> {
  const ok = await isCurrencyActive(currency);
  if (!ok) {
    throw validationError(`Currency ${currency} is not active or not supported`);
  }
}

/**
 * Clear cache (e.g. after adding new currency).
 */
export function clearCurrencyCache(): void {
  _cache = null;
}
