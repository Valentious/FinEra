/**
 * Allocate a unique 10-digit numeric wallet ID (0–9) for peer transfers.
 */

import type { Prisma } from "@prisma/client";

type Tx = Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

function randomTenDigits(): string {
  let s = "";
  for (let i = 0; i < 10; i++) {
    s += Math.floor(Math.random() * 10).toString();
  }
  return s;
}

export async function allocateWalletNumericId(tx: Tx): Promise<string> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const digits = randomTenDigits();
    const clash = await tx.wallet.findFirst({
      where: { walletNumericId: digits },
      select: { id: true },
    });
    if (!clash) return digits;
  }
  throw new Error("Could not allocate wallet numeric ID");
}
