/**
 * FinEra Backend - Fraud Detection Service
 */

import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/index.js";

const MAX_TXN_PER_MINUTE = 5;
const TEMP_EMAIL_DOMAINS = ["tempmail", "guerrilla", "mailinator", "10minutemail", "throwaway"];

export interface FraudCheckResult {
  allowed: boolean;
  reason?: string;
}

export async function checkTransactionVelocity(userId: string): Promise<FraudCheckResult> {
  const oneMinAgo = new Date(Date.now() - 60 * 1000);
  const count = await prisma.transaction.count({
    where: { userId, createdAt: { gte: oneMinAgo } },
  });
  if (count >= MAX_TXN_PER_MINUTE) {
    return { allowed: false, reason: "Transaction velocity exceeded" };
  }
  return { allowed: true };
}

export function checkEmailDomain(email: string): FraudCheckResult {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (TEMP_EMAIL_DOMAINS.some((d) => domain.includes(d))) {
    return { allowed: false, reason: "Temporary email not allowed" };
  }
  return { allowed: true };
}

export async function checkDuplicateTransaction(
  userId: string,
  amount: number,
  metadata: Record<string, unknown>
): Promise<FraudCheckResult> {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const similar = await prisma.transaction.findFirst({
    where: {
      userId,
      amount,
      createdAt: { gte: fiveMinAgo },
      metadata: { equals: metadata as Prisma.InputJsonValue },
    },
  });
  if (similar) {
    return { allowed: false, reason: "Duplicate transaction detected" };
  }
  return { allowed: true };
}

export async function runFraudChecks(
  userId: string,
  amount: number,
  metadata?: Record<string, unknown>
): Promise<FraudCheckResult> {
  const velocity = await checkTransactionVelocity(userId);
  if (!velocity.allowed) return velocity;

  const duplicate = await checkDuplicateTransaction(userId, amount, metadata ?? {});
  if (!duplicate.allowed) return duplicate;

  return { allowed: true };
}
