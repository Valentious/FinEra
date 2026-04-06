/**
 * Authoritative wallet balance from double-entry lines tagged LIABILITY:WALLET:{walletId}.
 * No wallet-row fallback - missing ledger lines require reconciliation.
 */

import { prisma } from "../../infrastructure/database/index.js";
import type { CurrencyCode } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { publishDomainEvent } from "../../infrastructure/messaging/event-bus.js";
import { validationError } from "../../middlewares/errorHandler.js";

function liabilityAccountCode(walletId: string): string {
  return `LIABILITY:WALLET:${walletId}`;
}

export async function getWalletBalanceFromLedger(walletId: string, currency: CurrencyCode): Promise<{ balance: number }> {
  const code = liabilityAccountCode(walletId);
  const rows = await prisma.ledgerEntry.findMany({
    where: { accountCode: code, currencyCode: currency },
    select: { entryType: true, amount: true },
  });
  if (rows.length === 0) {
    await publishDomainEvent("RECONCILIATION_REQUIRED", {
      walletId,
      currency,
      reason: "missing_ledger_entries_for_wallet_liability",
    });
    throw validationError(
      `No ledger entries for wallet liability ${code} in ${currency}. Reconciliation required.`
    );
  }
  let net = new Decimal(0);
  for (const r of rows) {
    const a = new Decimal(r.amount);
    if (r.entryType === "CREDIT") net = net.plus(a);
    else if (r.entryType === "DEBIT") net = net.minus(a);
  }
  return { balance: net.toNumber() };
}
