/**
 * Tamper-evident journal hash chain (per currency ledger).
 * Each sealed transaction links to the previous journal hash (GENESIS for first).
 */

import { createHash } from "node:crypto";

const GENESIS = "GENESIS";

export { GENESIS };

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function buildLedgerSealPayload(params: {
  previousHash: string;
  transactionId: string;
  userId: string;
  currency: string;
  /** Canonical representation of all double-entry lines */
  entryCanonical: string;
  createdAtIso: string;
}): string {
  return [
    params.previousHash,
    params.transactionId,
    params.userId,
    params.currency,
    params.entryCanonical,
    params.createdAtIso,
  ].join("|");
}
