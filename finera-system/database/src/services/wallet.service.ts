/**
 * FinEra Wallet Service - Repository Pattern
 * Process transactions with ledger entries and audit trail
 * Immutable ledger with full traceability
 */

import { db } from '../lib/db/client.js';
import type { PrismaClient, TransactionType, Prisma } from '@prisma/client';

export class WalletService {
  /**
   * Get wallet with balance and recent transactions
   */
  static async getWallet(userId: string) {
    return db.transaction(async (prisma) => {
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!wallet) {
        return prisma.wallet.create({
          data: {
            userId,
            balance: 0,
            status: 'ACTIVE',
          },
          include: {
            transactions: true,
          },
        });
      }

      return wallet;
    });
  }

  /**
   * Process transaction with ledger entries and audit log
   */
  static async processTransaction(
    userId: string,
    walletId: string,
    type: TransactionType,
    amount: number,
    description: string,
    metadata?: Prisma.InputJsonValue,
    ipAddress?: string,
    userAgent?: string
  ) {
    return db.transaction(async (prisma) => {
      const wallet = await prisma.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.userId !== userId) {
        throw new Error('Unauthorized');
      }

      const currentBalance = Number(wallet.balance);

      let newBalance = currentBalance;
      if (type === 'CREDIT') {
        newBalance = currentBalance + amount;
      } else if (type === 'DEBIT') {
        if (currentBalance < amount) {
          throw new Error('Insufficient funds');
        }
        newBalance = currentBalance - amount;
      } else if (type === 'REVERSAL') {
        newBalance = currentBalance - amount;
      }

      const reference = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      const transaction = await prisma.transaction.create({
        data: {
          reference,
          walletId,
          userId,
          type,
          amount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          status: 'COMPLETED',
          description,
          metadata: metadata ?? undefined,
          ipAddress,
          userAgent,
          completedAt: new Date(),
        },
      });

      await prisma.wallet.update({
        where: { id: walletId },
        data: {
          balance: newBalance,
          version: { increment: 1 },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId,
          transactionId: transaction.id,
          action: `TRANSACTION_${type}`,
          entityType: 'Transaction',
          entityId: transaction.id,
          newValues: {
            amount,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
          },
          ipAddress,
          userAgent,
        },
      });

      return transaction;
    });
  }

  /**
   * Reverse a transaction (full audit trail)
   */
  static async reverseTransaction(
    transactionId: string,
    userId: string,
    reason: string,
    ipAddress?: string
  ) {
    return db.transaction(async (prisma) => {
      const originalTx = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { wallet: true },
      });

      if (!originalTx) {
        throw new Error('Transaction not found');
      }

      if (originalTx.status === 'REVERSED') {
        throw new Error('Transaction already reversed');
      }

      const reversal = await prisma.transaction.create({
        data: {
          reference: `REV_${originalTx.reference}`,
          walletId: originalTx.walletId,
          userId: originalTx.userId,
          type: 'REVERSAL',
          amount: originalTx.amount,
          balanceBefore: Number(originalTx.balanceAfter),
          balanceAfter: Number(originalTx.balanceBefore),
          status: 'COMPLETED',
          description: `Reversal of ${originalTx.reference}: ${reason}`,
          reversalOfId: originalTx.id,
          ipAddress,
          completedAt: new Date(),
        },
      });

      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'REVERSED', reversedAt: new Date() },
      });

      await prisma.wallet.update({
        where: { id: originalTx.walletId },
        data: {
          balance: originalTx.balanceBefore,
          version: { increment: 1 },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId,
          transactionId: reversal.id,
          action: 'TRANSACTION_REVERSAL',
          entityType: 'Transaction',
          entityId: transactionId,
          oldValues: { status: originalTx.status },
          newValues: { status: 'REVERSED', reversalId: reversal.id },
          ipAddress,
        },
      });

      return reversal;
    });
  }
}
