/**
 * Trust score persistence, adjustments, and credit profile sync (Dynamic Credit Engine).
 */

import { prisma } from "../../../infrastructure/database/index.js";
import type { Prisma, RiskLevel } from "@prisma/client";
import {
  INITIAL_TRUST_SCORE,
  clampTrustScore,
  creditLimitForTrustScore,
  DAILY_POSITIVE_TRUST_GAIN_CAP,
} from "./dynamic-credit-engine.js";

type TrustMeta = {
  dailyGainUtcDate?: string;
  dailyGainAmount?: number;
  lastInactivityPenaltyAt?: string;
  lastWeeklyActivityBonusAt?: string;
  completedLoansForBonus?: number;
};

function utcDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function readTrustMeta(scoreFactors: Prisma.JsonValue | null): TrustMeta {
  if (!scoreFactors || typeof scoreFactors !== "object" || Array.isArray(scoreFactors)) return {};
  const root = scoreFactors as Record<string, unknown>;
  const tm = root.trustMeta;
  if (!tm || typeof tm !== "object" || Array.isArray(tm)) return {};
  return tm as TrustMeta;
}

function mergeScoreFactors(
  existing: Prisma.JsonValue | null | undefined,
  patch: { trustMeta?: TrustMeta; trustEngineVersion?: string }
): Prisma.InputJsonValue {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  const prevTrust = readTrustMeta(existing ?? null);
  return {
    ...base,
    trustEngineVersion: patch.trustEngineVersion ?? "dce-1",
    trustMeta: { ...prevTrust, ...patch.trustMeta },
  } as Prisma.InputJsonValue;
}

export function prismaRiskFromTrust(score: number): RiskLevel {
  const s = clampTrustScore(score);
  if (s < 20) return "VERY_HIGH";
  if (s < 40) return "HIGH";
  if (s < 70) return "MEDIUM";
  return "LOW";
}

export async function ensureCreditProfile(userId: string) {
  const existing = await prisma.creditProfile.findUnique({ where: { userId } });
  if (existing) return existing;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { accountType: true } });
  const initial = INITIAL_TRUST_SCORE;
  const limit = creditLimitForTrustScore(initial, user?.accountType);
  return prisma.creditProfile.create({
    data: {
      userId,
      financialDisciplineScore: initial,
      creditLimit: limit,
      availableCredit: limit,
      repaymentReliability: initial,
      savingsConsistency: initial,
      transactionHealth: initial,
      accountLongevity: 0,
      kycLevelBonus: 0,
      riskLevel: prismaRiskFromTrust(initial),
      lastScoreUpdate: new Date(),
      scoreFactors: mergeScoreFactors(null, {
        trustMeta: {},
      }),
    },
  });
}

async function getTrustMeta(userId: string): Promise<{ meta: TrustMeta; scoreFactors: Prisma.JsonValue | null }> {
  const p = await ensureCreditProfile(userId);
  return { meta: readTrustMeta(p.scoreFactors), scoreFactors: p.scoreFactors };
}

/**
 * Applies a trust delta with optional daily cap on net positive movement.
 */
export async function adjustTrustScore(
  userId: string,
  delta: number,
  opts?: { skipDailyCap?: boolean; trustMetaPatch?: TrustMeta }
): Promise<number> {
  if (!Number.isFinite(delta) || delta === 0) {
    const p = await ensureCreditProfile(userId);
    return p.financialDisciplineScore;
  }

  const profile = await ensureCreditProfile(userId);
  const { meta, scoreFactors } = await getTrustMeta(userId);
  const today = utcDateKey(new Date());
  let applied = delta;

  if (delta > 0 && !opts?.skipDailyCap) {
    const prevDay = meta.dailyGainUtcDate;
    const prevGain = prevDay === today ? (meta.dailyGainAmount ?? 0) : 0;
    const room = Math.max(0, DAILY_POSITIVE_TRUST_GAIN_CAP - prevGain);
    applied = Math.min(delta, room);
    if (applied <= 0) {
      return profile.financialDisciplineScore;
    }
  }

  const next = clampTrustScore(profile.financialDisciplineScore + applied);
  const newMeta: TrustMeta = { ...meta, ...opts?.trustMetaPatch };
  if (delta > 0 && !opts?.skipDailyCap) {
    newMeta.dailyGainUtcDate = today;
    newMeta.dailyGainAmount = (meta.dailyGainUtcDate === today ? (meta.dailyGainAmount ?? 0) : 0) + applied;
  }

  const userRow = await prisma.user.findUnique({ where: { id: userId }, select: { accountType: true } });
  const limit = creditLimitForTrustScore(next, userRow?.accountType);
  const outstanding = await sumActiveLoanBalances(userId);

  await prisma.creditProfile.update({
    where: { userId },
    data: {
      previousScore: profile.financialDisciplineScore,
      financialDisciplineScore: next,
      creditLimit: limit,
      availableCredit: Math.max(0, limit - outstanding),
      repaymentReliability: next,
      savingsConsistency: next,
      transactionHealth: next,
      riskLevel: prismaRiskFromTrust(next),
      lastScoreUpdate: new Date(),
      scoreFactors: mergeScoreFactors(scoreFactors, { trustMeta: newMeta }),
    },
  });

  return next;
}

export async function sumActiveLoanBalances(userId: string): Promise<number> {
  const loans = await prisma.loan.findMany({
    where: { userId, status: "ACTIVE" },
    select: { remainingBalance: true },
  });
  return loans.reduce((s, l) => s + Number(l.remainingBalance), 0);
}

/** Recompute stored creditLimit / availableCredit from current trust (no score change). */
export async function syncCreditProfileLimits(userId: string): Promise<void> {
  const profile = await ensureCreditProfile(userId);
  const userRow = await prisma.user.findUnique({ where: { id: userId }, select: { accountType: true } });
  const limit = creditLimitForTrustScore(profile.financialDisciplineScore, userRow?.accountType);
  const outstanding = await sumActiveLoanBalances(userId);
  await prisma.creditProfile.update({
    where: { userId },
    data: {
      creditLimit: limit,
      availableCredit: Math.max(0, limit - outstanding),
    },
  });
}

/** If user inactive 14+ days since last meaningful activity, apply -5 at most once per 14d window. */
export async function applyInactivityPenaltyIfNeeded(userId: string): Promise<void> {
  const profile = await ensureCreditProfile(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, authCredentials: { select: { lastLoginAt: true } } },
  });
  if (!user) return;

  const lastTx = await prisma.transaction.findFirst({
    where: { userId, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const candidates = [
    user.createdAt.getTime(),
    user.authCredentials?.lastLoginAt?.getTime() ?? 0,
    lastTx?.createdAt.getTime() ?? 0,
    profile.lastScoreUpdate?.getTime() ?? 0,
  ].filter((n) => n > 0);
  const lastActivity = new Date(Math.max(...candidates));

  const daysIdle = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
  if (daysIdle < 14) return;

  const meta = readTrustMeta(profile.scoreFactors);
  const lastPen = meta.lastInactivityPenaltyAt ? new Date(meta.lastInactivityPenaltyAt).getTime() : 0;
  if (lastPen && Date.now() - lastPen < 14 * 24 * 60 * 60 * 1000) return;

  await adjustTrustScore(userId, -5, {
    skipDailyCap: true,
    trustMetaPatch: { lastInactivityPenaltyAt: new Date().toISOString() },
  });
}

export async function onRepaymentTrustEvent(userId: string, opts: { earlyRepayment: boolean; loanFullyPaid: boolean }) {
  const delta = opts.earlyRepayment ? 8 : 5;
  await adjustTrustScore(userId, delta);

  if (!opts.loanFullyPaid) return;

  const profile = await prisma.creditProfile.findUnique({ where: { userId } });
  const meta = readTrustMeta(profile?.scoreFactors ?? null);
  const nextCount = (meta.completedLoansForBonus ?? 0) + 1;
  await prisma.creditProfile.update({
    where: { userId },
    data: {
      scoreFactors: mergeScoreFactors(profile?.scoreFactors ?? null, {
        trustMeta: { completedLoansForBonus: nextCount },
      }),
    },
  });
  if (nextCount > 0 && nextCount % 3 === 0) {
    await adjustTrustScore(userId, 10, { skipDailyCap: true });
  }
}

/** Stable inflow: modest positive bump on material deposit (still subject to daily cap). */
export async function onDepositTrustActivity(userId: string, amount: number) {
  if (!Number.isFinite(amount) || amount < 50) return;
  const bump = amount >= 500 ? 5 : amount >= 200 ? 4 : 2;
  await adjustTrustScore(userId, bump);
}
