/**
 * Notification Service Event Consumer
 * Consumes user.registered, transaction.completed, credit.score.updated, learning.module.completed
 */

import { eventBus, EventType } from '@finera/shared/events';
import { addNotification } from './notification-store.js';

export async function startNotificationEventConsumer(): Promise<void> {
  await eventBus.consume(
    'notification.service.queue',
    async (event, ack, nack) => {
      try {
        switch (event.type) {
          case EventType.USER_REGISTERED:
            await handleUserRegistered(event);
            break;
          case EventType.TRANSACTION_COMPLETED:
            await handleTransactionCompleted(event);
            break;
          case EventType.CREDIT_SCORE_UPDATED:
            await handleCreditScoreUpdated(event);
            break;
          case EventType.MODULE_COMPLETED:
            await handleModuleCompleted(event);
            break;
          default:
            console.log(`[Notification] Unhandled event: ${event.type}`);
        }
        ack();
      } catch (error) {
        console.error(`[Notification] Error processing ${event.type}:`, error);
        nack(true);
      }
    },
    { prefetch: 20 }
  );
  console.log('[Notification] Event consumer started');
}

async function handleUserRegistered(event: { data: Record<string, unknown> }): Promise<void> {
  const userId = event.data.userId as string;
  const email = event.data.email as string;
  const firstName = (event.data.firstName as string) || 'User';
  if (!userId) return;

  addNotification(userId, {
    id: `welcome-${Date.now()}`,
    title: 'Welcome to FinEra!',
    message: `Hi ${firstName}, welcome to FinEra Inclusive Credit. Start exploring our financial education modules.`,
    isRead: false,
  });

  console.log(`[Notification] Welcome notification created for ${email}`);
}

async function handleTransactionCompleted(event: { data: Record<string, unknown> }): Promise<void> {
  const userId = event.data.userId as string;
  const amount = event.data.amount;
  const type = event.data.type;
  if (!userId) return;

  console.log(`[Notification] Transaction ${type} for ${userId}: ${amount} (future: push/email)`);
}

async function handleCreditScoreUpdated(event: { data: Record<string, unknown> }): Promise<void> {
  const userId = event.data.userId as string;
  const newScore = event.data.newScore ?? event.data.overallScore;
  if (!userId) return;

  console.log(`[Notification] Credit score updated for ${userId}: ${newScore} (future: alert)`);
}

async function handleModuleCompleted(event: { data: Record<string, unknown> }): Promise<void> {
  const userId = event.data.userId as string;
  const moduleTitle = event.data.moduleTitle as string;
  if (!userId) return;

  console.log(`[Notification] Module completed by ${userId}: ${moduleTitle} (future: certificate)`);
}
