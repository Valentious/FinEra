/**
 * Ledger Service Event Consumer
 * Consumes user.registered, transaction.completed (idempotent handlers)
 */

import { eventBus, EventType } from '@finera/shared/events';
import { db } from '@finera/database';

export async function startLedgerEventConsumer(): Promise<void> {
  await eventBus.consume(
    'ledger.service.queue',
    async (event, ack, nack) => {
      try {
        switch (event.type) {
          case EventType.USER_REGISTERED:
            await handleUserRegistered(event);
            break;
          case EventType.TRANSACTION_COMPLETED:
            await handleTransactionCompleted(event);
            break;
          default:
            console.log(`[Ledger] Unhandled event: ${event.type}`);
        }
        ack();
      } catch (error) {
        console.error(`[Ledger] Error processing ${event.type}:`, error);
        nack(true);
      }
    },
    { prefetch: 10 }
  );
  console.log('[Ledger] Event consumer started');
}

async function handleUserRegistered(event: { data: Record<string, unknown> }): Promise<void> {
  const userId = event.data.userId as string;
  if (!userId) return;

  const prisma = db.getClient();
  const existing = await prisma.wallet.findUnique({ where: { userId } });
  if (existing) {
    console.log(`[Ledger] Wallet already exists for ${userId} (idempotent)`);
    return;
  }

  const wallet = await db.transaction(async (tx) => {
    return tx.wallet.create({
      data: {
        userId,
        balance: 0,
        currency: 'USD',
        status: 'ACTIVE',
        version: 1,
      },
    });
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'WALLET_CREATED',
      entityType: 'Wallet',
      entityId: wallet.id,
      newValues: {
        walletId: wallet.id,
        createdVia: 'event-driven',
        timestamp: new Date().toISOString(),
      },
    },
  });

  console.log(`[Ledger] Wallet created for ${userId} via event`);
}

async function handleTransactionCompleted(event: { data: Record<string, unknown> }): Promise<void> {
  console.log(`[Ledger] Transaction completed (audit):`, event.data.transactionId);
}
