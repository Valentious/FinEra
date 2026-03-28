/**
 * Rule: ONE concurrent ACTIVE loan per Wallet (one currency / one ledger in product terms).
 * Loans are bound with Loan.walletId; do not open another ACTIVE loan on the same wallet.
 */

import type { PrismaClient } from "@prisma/client";
import { validationError } from "../../middlewares/errorHandler.js";

type DbLoan = Pick<PrismaClient, "loan">;

export async function countActiveLoansOnWallet(db: DbLoan, walletId: string): Promise<number> {
  return db.loan.count({
    where: { walletId, status: "ACTIVE" },
  });
}

export async function assertWalletHasNoActiveLoan(db: DbLoan, walletId: string): Promise<void> {
  const n = await countActiveLoansOnWallet(db, walletId);
  if (n > 0) {
    throw validationError(
      "This currency wallet already has an active loan. One active loan per currency wallet."
    );
  }
}
