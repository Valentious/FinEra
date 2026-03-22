/**
 * FinEra Credit Engine - Score initialization
 * POST /initialize (orchestration), GET /score/:userId
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { db } from '@finera/database';
import { RiskLevel } from '@prisma/client';

export const creditRoutes = Router();

const creditSchema = z.object({
  userId: z.string(),
  userType: z.enum(['STUDENT', 'STAFF', 'ALUMNI']),
  initialScore: z.number().min(0).max(100).default(60),
  metadata: z.record(z.unknown()).optional(),
});

function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'EXCELLENT';
  if (score >= 70) return 'LOW';
  if (score >= 60) return 'MEDIUM';
  if (score >= 50) return 'HIGH';
  return 'CRITICAL';
}

creditRoutes.post('/initialize', async (req: Request, res: Response) => {
  try {
    const validatedData = creditSchema.parse(req.body);
    const prisma = db.getClient();

    let baseScore = validatedData.initialScore;
    if (validatedData.userType === 'STAFF') baseScore = Math.min(100, baseScore + 10);
    if (validatedData.userType === 'ALUMNI') baseScore = Math.min(100, baseScore + 15);

    const nextCalc = new Date();
    nextCalc.setDate(nextCalc.getDate() + 30);

    const creditScore = await db.transaction(async (tx) => {
      const existing = await tx.creditScore.findUnique({
        where: { userId: validatedData.userId },
      });
      if (existing) return existing;

      return tx.creditScore.create({
        data: {
          userId: validatedData.userId,
          overallScore: baseScore,
          paymentHistory: Math.floor(baseScore * 0.35),
          creditUtilization: Math.floor(baseScore * 0.3),
          lengthOfCredit: Math.floor(baseScore * 0.15),
          newCredit: Math.floor(baseScore * 0.1),
          creditMix: Math.floor(baseScore * 0.1),
          disciplineScore: Math.floor(baseScore * 0.8),
          riskLevel: getRiskLevel(baseScore),
          scoreHistory: [
            { score: baseScore, date: new Date().toISOString(), event: 'Initial registration' },
          ],
          lastCalculated: new Date(),
          nextCalculation: nextCalc,
          positiveFactors: ['New account', 'Clean financial history'],
          negativeFactors: [],
        },
      });
    });

    await prisma.auditLog.create({
      data: {
        userId: validatedData.userId,
        action: 'CREDIT_SCORE_INITIALIZED',
        entityType: 'CreditScore',
        entityId: creditScore.id,
        newValues: {
          score: creditScore.overallScore,
          riskLevel: creditScore.riskLevel,
          timestamp: new Date().toISOString(),
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        scoreId: creditScore.id,
        userId: creditScore.userId,
        score: creditScore.overallScore,
        riskLevel: creditScore.riskLevel,
        nextCalculation: creditScore.nextCalculation,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: err.errors });
    }
    console.error('Credit initialization error:', err);
    res.status(500).json({ success: false, error: 'Credit score initialization failed' });
  }
});

creditRoutes.get('/score/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const score = await db.getClient().creditScore.findUnique({
      where: { userId },
    });

    if (!score) {
      return res.status(404).json({ success: false, error: 'Credit score not found' });
    }

    res.json({
      success: true,
      data: {
        overallScore: score.overallScore,
        disciplineScore: score.disciplineScore,
        riskLevel: score.riskLevel,
        nextCalculation: score.nextCalculation,
      },
    });
  } catch (err) {
    console.error('Credit fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch credit score' });
  }
});
