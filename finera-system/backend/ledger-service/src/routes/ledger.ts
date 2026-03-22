/**
 * FinEra Ledger Service - Wallet creation, double-entry ledger
 * POST /wallets, GET /wallets/:userId, POST /transactions (with event publishing)
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { db } from '@finera/database';
import { eventBus, EventType } from '@finera/shared/events';

export const ledgerRoutes = Router();

const walletSchema = z.object({
  userId: z.string(),
  currency: z.string().default('USD'),
  initialBalance: z.number().default(0),
  metadata: z.record(z.unknown()).optional(),
});

ledgerRoutes.post('/wallets', async (req: Request, res: Response) => {
  try {
    const validatedData = walletSchema.parse(req.body);
    const prisma = db.getClient();

    const wallet = await db.transaction(async (tx) => {
      const existing = await tx.wallet.findUnique({
        where: { userId: validatedData.userId },
      });
      if (existing) return existing;

      return tx.wallet.create({
        data: {
          userId: validatedData.userId,
          balance: validatedData.initialBalance,
          currency: validatedData.currency,
          status: 'ACTIVE',
          version: 1,
        },
      });
    });

    await prisma.auditLog.create({
      data: {
        userId: validatedData.userId,
        action: 'WALLET_CREATED',
        entityType: 'Wallet',
        entityId: wallet.id,
        newValues: {
          balance: validatedData.initialBalance,
          currency: validatedData.currency,
          timestamp: new Date().toISOString(),
          ...(validatedData.metadata as object),
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        walletId: wallet.id,
        userId: wallet.userId,
        balance: Number(wallet.balance),
        currency: wallet.currency,
        status: wallet.status,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: err.errors });
    }
    console.error('Wallet creation error:', err);
    res.status(500).json({ success: false, error: 'Wallet creation failed' });
  }
});

const transactionSchema = z.object({
  userId: z.string(),
  walletId: z.string(),
  amount: z.number().positive(),
  type: z.enum(['CREDIT', 'DEBIT', 'FEE', 'REFUND']),
  description: z.string().default('Transaction'),
  metadata: z.record(z.unknown()).optional(),
});

ledgerRoutes.post('/transactions', async (req: Request, res: Response) => {
  try {
    const validatedData = transactionSchema.parse(req.body);
    const prisma = db.getClient();

    const result = await db.transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { id: validatedData.walletId },
      });
      if (!wallet || wallet.userId !== validatedData.userId) {
        throw new Error('Wallet not found');
      }

      const balanceBefore = Number(wallet.balance);
      const amount = validatedData.amount;
      const isCredit = ['CREDIT', 'REFUND'].includes(validatedData.type);
      const balanceAfter = isCredit ? balanceBefore + amount : balanceBefore - amount;

      if (balanceAfter < 0) throw new Error('Insufficient balance');

      const [updatedWallet, transaction] = await Promise.all([
        tx.wallet.update({
          where: { id: validatedData.walletId },
          data: { balance: balanceAfter },
        }),
        tx.transaction.create({
          data: {
            reference: `tx-${randomUUID()}`,
            walletId: validatedData.walletId,
            userId: validatedData.userId,
            type: validatedData.type,
            amount,
            balanceBefore,
            balanceAfter,
            currency: wallet.currency,
            status: 'COMPLETED',
            description: validatedData.description,
            metadata: validatedData.metadata as object,
            completedAt: new Date(),
          },
        }),
      ]);

      return { transaction, balanceBefore, balanceAfter };
    });

    eventBus
      .publish('transaction.events', 'transaction.completed', {
        type: EventType.TRANSACTION_COMPLETED,
        version: 1,
        source: 'ledger-service',
        data: {
          transactionId: result.transaction.id,
          userId: validatedData.userId,
          walletId: validatedData.walletId,
          amount: validatedData.amount,
          type: validatedData.type,
          status: 'COMPLETED',
          reference: result.transaction.reference,
          balanceBefore: result.balanceBefore,
          balanceAfter: result.balanceAfter,
          description: validatedData.description,
        },
        metadata: {
          correlationId: req.headers['x-correlation-id'] as string | undefined,
          userId: validatedData.userId,
        },
      })
      .catch((err) => console.error('[Ledger] Failed to publish transaction event:', err));

    res.status(201).json({
      success: true,
      data: {
        id: result.transaction.id,
        reference: result.transaction.reference,
        amount: validatedData.amount,
        type: validatedData.type,
        status: 'COMPLETED',
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: err.errors });
    }
    console.error('Transaction error:', err);
    res.status(500).json({ success: false, error: 'Transaction failed' });
  }
});

ledgerRoutes.get('/wallets/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const wallet = await db.getClient().wallet.findUnique({
      where: { userId },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    res.json({ success: true, data: wallet });
  } catch (err) {
    console.error('Wallet fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch wallet' });
  }
});
