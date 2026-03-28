/**
 * Custodian ↔ FinEra mapping (real-bank integration).
 *
 * - Currency Ledger (per currency) + custodyAccountNumber → custodian **omnibus** for that currency.
 * - LedgerAccount (per user, per currency) + custodianReference → custodian **sub-account** / virtual account.
 *
 * Populate `Ledger.custodianOmnibusExternalId` and `LedgerAccount.custodianReference` when the bank provides IDs.
 */

import type { CurrencyCode } from "@prisma/client";

/** Synthetic routing keys for internal reclassifications (approved credit → savings) on the hash chain. */
export function internalApprovedPool(accountNumber: string): string {
  return `${accountNumber}#APPROVED`;
}

export function internalSavingsPool(accountNumber: string): string {
  return `${accountNumber}#SAVINGS`;
}

export function describeCustodianLayers(currency: CurrencyCode): string {
  return [
    `Currency ${currency}: Ledger row = omnibus control + chain anchor; custodyAccountNumber = FinEra omnibus account digits.`,
    `User: LedgerAccount row = sub-ledger balances; custodianReference / externalBankAccountId = bank sub-account when linked.`,
  ].join(" ");
}
