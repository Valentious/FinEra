/**
 * FinEra Trust Score (Dynamic Credit Engine) — persisted 0–100 score with tier-based limits.
 * `financialDisciplineScore` on CreditProfile is the canonical Trust Score.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "../../../infrastructure/database/index.js";
import { INITIAL_TRUST_SCORE } from "./dynamic-credit-engine.js";
import {
  applyInactivityPenaltyIfNeeded,
  ensureCreditProfile,
  prismaRiskFromTrust,
  syncCreditProfileLimits,
} from "./trust-score.service.js";

export interface ScoreComponents {
  repaymentReliability: number;
  savingsConsistency: number;
  transactionHealth: number;
  accountLongevity: number;
  kycLevelBonus: number;
  incomeStability: number;
  crossProductHolding: number;
  referralNetworkHealth: number;
}

function syntheticComponents(score: number): ScoreComponents {
  const s = Math.min(100, Math.max(0, Math.round(score)));
  return {
    repaymentReliability: s,
    savingsConsistency: s,
    transactionHealth: s,
    accountLongevity: s,
    kycLevelBonus: s,
    incomeStability: s,
    crossProductHolding: s,
    referralNetworkHealth: s,
  };
}

export class CreditScoreEngine {
  async calculateScore(userId: string): Promise<{ score: number; components: ScoreComponents }> {
    await ensureCreditProfile(userId);
    await applyInactivityPenaltyIfNeeded(userId);
    await syncCreditProfileLimits(userId);

    const profile = await prisma.creditProfile.findUnique({ where: { userId } });
    const score = profile?.financialDisciplineScore ?? INITIAL_TRUST_SCORE;
    const components = syntheticComponents(score);

    const prevFactors =
      profile?.scoreFactors && typeof profile.scoreFactors === "object" && !Array.isArray(profile.scoreFactors)
        ? (profile.scoreFactors as Record<string, unknown>)
        : {};
    const mergedFactors = {
      ...prevFactors,
      components,
      trustEngineVersion: (typeof prevFactors.trustEngineVersion === "string" ? prevFactors.trustEngineVersion : null) ?? "dce-1",
    } as unknown as Prisma.InputJsonValue;

    await prisma.creditProfile.update({
      where: { userId },
      data: {
        scoreFactors: mergedFactors,
        riskLevel: prismaRiskFromTrust(score),
        lastScoreUpdate: new Date(),
      },
    });

    return { score, components };
  }
}
