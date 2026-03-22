/**
 * FinEra Ledger Service - Wallet creation, double-entry ledger
 * Event-driven: consumes user.registered (optional, EVENT_CONSUMER_ENABLED=true)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '../../database/.env') });
import express from 'express';
import cors from 'cors';
import { db } from '@finera/database';
import { eventBus } from '@finera/shared/events';
import { ledgerRoutes } from './routes/ledger.js';
import { startLedgerEventConsumer } from './event-consumer.js';

const app = express();
const PORT = process.env.PORT || 4004;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'ledger-service' }));
app.use('/api/v1/ledger', ledgerRoutes);

async function start() {
  await db.connect();

  if (process.env.EVENT_CONSUMER_ENABLED === 'true' && process.env.RABBITMQ_URL) {
    try {
      await eventBus.connect();
      await startLedgerEventConsumer();
    } catch (err) {
      console.warn('[Ledger] Event consumer unavailable (continuing without):', (err as Error).message);
    }
  }

  app.listen(PORT, () => console.log(`FinEra Ledger Service: http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start ledger service:', err);
  process.exit(1);
});
