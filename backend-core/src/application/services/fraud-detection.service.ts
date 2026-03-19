/**
 * FinEra - Multi-Layer Fraud Detection System
 */

import { subMinutes } from "date-fns";
import { prisma } from "../../infrastructure/database/index.js";

export interface FraudDetectionContext {
  userId?: string;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  endpoint: string;
  requestBody: unknown;
  timestamp: Date;
}

export interface FraudAnalysisResult {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  triggeredRules: { name: string; description: string; severity: string }[];
  action: "ALLOW" | "FLAG" | "REQUIRE_2FA" | "BLOCK";
  requiresVerification: boolean;
}

export type FraudAction = "ALLOW" | "FLAG" | "REQUIRE_2FA" | "BLOCK";

export class FraudDetectionService {
  async analyze(context: FraudDetectionContext): Promise<FraudAnalysisResult> {
    let totalRiskScore = 0;
    const triggeredRules: { name: string; description: string; severity: string }[] = [];

    const [velocity, duplicate, amount] = await Promise.all([
      this.velocityCheck(context),
      this.duplicateCheck(context),
      this.amountAnomalyCheck(context),
    ]);

    if (velocity.riskScore > 0) {
      totalRiskScore += velocity.riskScore;
      triggeredRules.push(...velocity.rules);
    }
    if (duplicate.riskScore > 0) {
      totalRiskScore += duplicate.riskScore;
      triggeredRules.push(...duplicate.rules);
    }
    if (amount.riskScore > 0) {
      totalRiskScore += amount.riskScore;
      triggeredRules.push(...amount.rules);
    }

    const action = this.determineAction(totalRiskScore);
    const riskLevel = this.getRiskLevel(totalRiskScore);

    if (context.userId && (totalRiskScore >= 30 || triggeredRules.length > 0)) {
      await prisma.fraudLog.create({
        data: {
          userId: context.userId,
          ruleTriggered: triggeredRules.map((r) => r.name).join(",") || "NONE",
          riskScore: totalRiskScore,
          riskLevel: riskLevel as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
          action,
          actionTaken: action,
          details: {
            ipAddress: context.ipAddress,
            endpoint: context.endpoint,
            timestamp: context.timestamp,
          } as object,
        },
      });
    }

    return {
      riskScore: totalRiskScore,
      riskLevel,
      triggeredRules,
      action,
      requiresVerification: action === "REQUIRE_2FA" || action === "BLOCK",
    };
  }

  private async velocityCheck(ctx: FraudDetectionContext): Promise<{ riskScore: number; rules: { name: string; description: string; severity: string }[] }> {
    if (!ctx.userId) return { riskScore: 0, rules: [] };

    const fiveMinAgo = subMinutes(new Date(), 5);
    const count = await prisma.transaction.count({
      where: { userId: ctx.userId, createdAt: { gte: fiveMinAgo } },
    });

    if (count > 10) {
      return {
        riskScore: 80,
        rules: [{ name: "HIGH_VELOCITY", description: "More than 10 transactions in 5 minutes", severity: "HIGH" }],
      };
    }
    if (count > 5) {
      return {
        riskScore: 40,
        rules: [{ name: "MEDIUM_VELOCITY", description: "More than 5 transactions in 5 minutes", severity: "MEDIUM" }],
      };
    }
    return { riskScore: 0, rules: [] };
  }

  private async duplicateCheck(ctx: FraudDetectionContext): Promise<{ riskScore: number; rules: { name: string; description: string; severity: string }[] }> {
    if (!ctx.userId || typeof ctx.requestBody !== "object" || ctx.requestBody === null) return { riskScore: 0, rules: [] };

    const body = ctx.requestBody as { amount?: number };
    const amount = body.amount;
    if (typeof amount !== "number" || amount <= 0) return { riskScore: 0, rules: [] };

    const fiveMinAgo = subMinutes(new Date(), 5);
    const similar = await prisma.transaction.findFirst({
      where: {
        userId: ctx.userId,
        amount,
        createdAt: { gte: fiveMinAgo },
      },
    });

    if (similar) {
      return {
        riskScore: 70,
        rules: [{ name: "DUPLICATE_TXN", description: "Identical transaction within 5 minutes", severity: "HIGH" }],
      };
    }
    return { riskScore: 0, rules: [] };
  }

  private async amountAnomalyCheck(ctx: FraudDetectionContext): Promise<{ riskScore: number; rules: { name: string; description: string; severity: string }[] }> {
    if (typeof ctx.requestBody !== "object" || ctx.requestBody === null) return { riskScore: 0, rules: [] };
    const body = ctx.requestBody as { amount?: number };
    const amount = body.amount ?? 0;
    if (amount > 100000) {
      return {
        riskScore: 50,
        rules: [{ name: "LARGE_AMOUNT", description: "Transaction exceeds $100,000", severity: "MEDIUM" }],
      };
    }
    return { riskScore: 0, rules: [] };
  }

  private determineAction(riskScore: number): FraudAction {
    if (riskScore >= 80) return "BLOCK";
    if (riskScore >= 60) return "REQUIRE_2FA";
    if (riskScore >= 40) return "FLAG";
    return "ALLOW";
  }

  private getRiskLevel(score: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    if (score >= 70) return "CRITICAL";
    if (score >= 50) return "HIGH";
    if (score >= 30) return "MEDIUM";
    return "LOW";
  }
}
