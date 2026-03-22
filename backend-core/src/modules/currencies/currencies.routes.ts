/**
 * FinEra - Multi-Currency Dashboard API
 * GET /currencies - List active currencies with dashboard config
 * GET /dashboard-config - Full config per currency (for dynamic UI)
 */

import { Router } from "express";
import { prisma } from "../../infrastructure/database/index.js";

const router = Router();

/** Currency config fallback when DB has no registry entries */
const FALLBACK_CONFIG: Record<string, { displayName: string; symbol: string; custodyType: string; dashboardConfig: object }> = {
  USD: { displayName: "US Dollar", symbol: "$", custodyType: "bank", dashboardConfig: { minAmount: 1, maxAmount: 999999, feePercent: 0.1, dailyLimit: 50000, features: ["international", "strict_compliance"] } },
  ZIG: { displayName: "Zimbabwe Gold (ZiG)", symbol: "Z$", custodyType: "momo", dashboardConfig: { minAmount: 10, maxAmount: 999999999, feePercent: 0.5, dailyLimit: 50000000, features: ["local_transfers"] } },
  ZAR: { displayName: "South African Rand", symbol: "R", custodyType: "bank", dashboardConfig: { minAmount: 5, maxAmount: 999999, feePercent: 0.2, dailyLimit: 100000, features: ["regional_transfers"] } },
  USDT: { displayName: "Tether (USDT)", symbol: "₮", custodyType: "blockchain", dashboardConfig: { minAmount: 1, maxAmount: 999999, feePercent: 0.5, dailyLimit: 100000, features: ["blockchain", "gas_fees"] } },
  EUR: { displayName: "Euro", symbol: "€", custodyType: "bank", dashboardConfig: { minAmount: 1, maxAmount: 999999, feePercent: 0.15, dailyLimit: 50000, features: ["international"] } },
  GBP: { displayName: "British Pound", symbol: "£", custodyType: "bank", dashboardConfig: { minAmount: 1, maxAmount: 999999, feePercent: 0.15, dailyLimit: 50000, features: ["international"] } },
};

/**
 * GET /currencies
 * Returns active currencies for dynamic dashboard loading.
 */
router.get("/", async (_req, res, next) => {
  try {
    let registry: Array<{ currencyCode: string; displayName: string; symbol: string; status: string; custodyType: string; dashboardConfig: unknown }> = [];
    try {
      registry = await prisma.currencyRegistry.findMany({
        where: { status: "active" },
        select: { currencyCode: true, displayName: true, symbol: true, status: true, custodyType: true, dashboardConfig: true },
      });
    } catch {
      /* DB may not have table yet */
    }

    if (registry.length === 0) {
      const codes = ["USD", "ZIG", "ZAR", "USDT"] as const;
      registry = codes.map((c) => {
        const fc = FALLBACK_CONFIG[c] ?? { displayName: c, symbol: c, custodyType: "bank", dashboardConfig: {} };
        return {
          currencyCode: c,
          displayName: fc.displayName,
          symbol: fc.symbol,
          status: "active",
          custodyType: fc.custodyType,
          dashboardConfig: fc.dashboardConfig,
        };
      });
    }

    res.json({
      success: true,
      data: registry.map((r) => ({
        currencyCode: r.currencyCode,
        displayName: r.displayName,
        symbol: r.symbol,
        status: r.status,
        custodyType: r.custodyType,
        dashboardConfig: r.dashboardConfig,
      })),
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /dashboard-config
 * Returns dashboard config for all currencies (or optional ?currency=USD)
 */
router.get("/dashboard-config", async (req, res, next) => {
  try {
    const currency = req.query.currency as string | undefined;
    let registry: Array<{ currencyCode: string; displayName: string; symbol: string; custodyType: string; dashboardConfig: unknown }> = [];
    try {
      const where = currency ? { currencyCode: currency as "USD" | "ZIG" | "ZAR" | "EUR" | "GBP" | "USDT", status: "active" } : { status: "active" };
      registry = await prisma.currencyRegistry.findMany({
        where,
        select: { currencyCode: true, displayName: true, symbol: true, custodyType: true, dashboardConfig: true },
      });
    } catch {
      /* fallback */
    }

    if (registry.length === 0) {
      const codes = currency ? [currency] : (["USD", "ZIG", "ZAR", "USDT"] as const);
      registry = codes.map((c) => {
        const fc = FALLBACK_CONFIG[c] ?? (FALLBACK_CONFIG.USD as { displayName: string; symbol: string; custodyType: string; dashboardConfig: object });
        return {
          currencyCode: c,
          displayName: fc.displayName,
          symbol: fc.symbol,
          custodyType: fc.custodyType,
          dashboardConfig: fc.dashboardConfig,
        };
      });
    }

    const config = currency && registry.length === 1
      ? registry[0].dashboardConfig
      : Object.fromEntries(registry.map((r) => [r.currencyCode, { displayName: r.displayName, symbol: r.symbol, custodyType: r.custodyType, ...(r.dashboardConfig as object) }]));

    res.json({ success: true, data: config });
  } catch (e) {
    next(e);
  }
});

export default router;
