/**
 * Per-currency loan outstanding: SUM(remainingBalance) for ACTIVE loans only.
 * Never aggregate across currencies.
 */

import type { CurrencyCode, Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/index.js";

type Tx = Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

export async function sumActiveLoanOutstanding(
  userId: string,
  currency: CurrencyCode,
  tx: Tx | typeof prisma = prisma
): Promise<number> {
  const agg = await tx.loan.aggregate({
    where: {
      userId,
      currency,
      status: "ACTIVE",
    },
    _sum: { remainingBalance: true },
  });
  return Number(agg._sum.remainingBalance ?? 0);
}
