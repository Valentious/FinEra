/**
 * FinEra Notification Service
 * Sends in-app, email, push notifications.
 * Event-driven: consumes user.registered, transaction.completed, etc. (optional)
 */

import express from 'express';
import cors from 'cors';
import { eventBus } from '@finera/shared/events';
import { notificationRoutes } from './routes/notification.js';
import { startNotificationEventConsumer } from './event-consumer.js';

const app = express();
const PORT = process.env.PORT || 4005;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification-service' }));
app.use('/api/v1/notifications', notificationRoutes);

async function start() {
  if (process.env.EVENT_CONSUMER_ENABLED === 'true' && process.env.RABBITMQ_URL) {
    try {
      await eventBus.connect();
      await startNotificationEventConsumer();
    } catch (err) {
      console.warn('[Notification] Event consumer unavailable (continuing without):', (err as Error).message);
    }
  }

  app.listen(PORT, () => {
    console.log(`FinEra Notification Service: http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start notification service:', err);
  process.exit(1);
});
