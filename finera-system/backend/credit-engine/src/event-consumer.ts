/**
 * Credit Engine Event Consumer
 * Consumes user.registered, transaction.completed, learning.module.completed
 */

import { eventBus, EventType } from '@finera/shared/events';
import { db } from '@finera/database';
import { RiskLevel } from '@prisma/client';

export async function startCreditEventConsumer(): Promise<void> {
  await eventBus.consume(
    'credit.engine.queue',
    async (event, ack, nack) => {
      try {
        switch (event.type) {
          case EventType.USER_REGISTERED:
            await handleUserRegistered(event);
            break;
          case EventType.TRANSACTION_COMPLETED:
            await handleTransactionCompleted(event);
            break;
          case EventType.MODULE_COMPLETED:
            await handleModuleCompleted(event);
            break;
          default:
            console.log(`[Credit] Unhandled event: ${event.type}`);
        }
        ack();
      } catch (error) {
        console.error(`[Credit] Error processing ${event.type}:`, error);
        nack(true);
      }
    },
    { prefetch: 5 }
  );
  console.log('[Credit] Event consumer started');
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'EXCELLENT';
  if (score >= 70) return 'LOW';
  if (score >= 60) return 'MEDIUM';
  if (score >= 50) return 'HIGH';
  return 'CRITICAL';
}

async function handleUserRegistered(event: { data: Record<string, unknown> }): Promise<void> {
  const userId = event.data.userId as string;
  const userType = (event.data.userType as string) || 'STUDENT';
  if (!userId) return;

  const prisma = db.getClient();
  const existing = await prisma.creditScore.findUnique({ where: { userId } });
  if (existing) {
    console.log(`[Credit] Score already exists for ${userId} (idempotent)`);
    return;
  }

  let baseScore = 60;
  if (userType === 'STAFF') baseScore = Math.min(100, baseScore + 10);
  if (userType === 'ALUMNI') baseScore = Math.min(100, baseScore + 15);

  const nextCalc = new Date();
  nextCalc.setDate(nextCalc.getDate() + 30);

  const creditScore = await db.transaction(async (tx) => {
    return tx.creditScore.create({
      data: {
        userId,
        overallScore: baseScore,
        paymentHistory: Math.floor(baseScore * 0.35),
        creditUtilization: Math.floor(baseScore * 0.3),
        lengthOfCredit: Math.floor(baseScore * 0.15),
        newCredit: Math.floor(baseScore * 0.1),
        creditMix: Math.floor(baseScore * 0.1),
        disciplineScore: Math.floor(baseScore * 0.8),
        riskLevel: getRiskLevel(baseScore),
        scoreHistory: [
          { score: baseScore, date: new Date().toISOString(), event: 'Event-driven init' },
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
      userId,
      action: 'CREDIT_SCORE_INITIALIZED',
      entityType: 'CreditScore',
      entityId: creditScore.id,
      newValues: {
        score: creditScore.overallScore,
        riskLevel: creditScore.riskLevel,
        createdVia: 'event-driven',
        timestamp: new Date().toISOString(),
      },
    },
  });

  console.log(`[Credit] Score initialized for ${userId} via event`);
}

async function handleTransactionCompleted(event: { data: Record<string, unknown> }): Promise<void> {
  console.log(`[Credit] Transaction completed (future: update score):`, event.data.transactionId);
}

async function handleModuleCompleted(event: { data: Record<string, unknown> }): Promise<void> {
  const userId = event.data.userId as string;
  const moduleTitle = event.data.moduleTitle as string;
  if (!userId) return;

  console.log(`[Credit] Module completed by ${userId}: ${moduleTitle} (future: boost score)`);
}
