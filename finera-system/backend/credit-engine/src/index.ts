/**
 * FinEra Credit Engine - Single centralized engine
 * Event-driven: consumes user.registered, learning.module.completed (optional)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '../../database/.env') });
import express from 'express';
import cors from 'cors';
import { db } from '@finera/database';
import { eventBus } from '@finera/shared/events';
import { creditRoutes } from './routes/credit.js';
import { startCreditEventConsumer } from './event-consumer.js';

const app = express();
const PORT = process.env.PORT || 4003;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'credit-engine' }));
app.use('/api/v1/credit', creditRoutes);

async function start() {
  await db.connect();

  if (process.env.EVENT_CONSUMER_ENABLED === 'true' && process.env.RABBITMQ_URL) {
    try {
      await eventBus.connect();
      await startCreditEventConsumer();
    } catch (err) {
      console.warn('[Credit] Event consumer unavailable (continuing without):', (err as Error).message);
    }
  }

  app.listen(PORT, () => console.log(`FinEra Credit Engine: http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start credit engine:', err);
  process.exit(1);
});
