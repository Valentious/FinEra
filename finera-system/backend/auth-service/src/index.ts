/**
 * FinEra Auth Service
 * Registration orchestrates: user profile, wallet, credit score, admin audit.
 * Service independence via HTTP; failure isolation; compensation on critical failure.
 * Event-driven: publishes USER_REGISTERED for async consumers (optional).
 */

import './config/env.js';
import express from 'express';
import cors from 'cors';
import { db } from '@finera/database';
import { authRoutes } from './routes/auth.js';
import { eventBus } from '@finera/shared/events';

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }));
app.use('/api/v1/auth', authRoutes);

async function start() {
  await db.connect();

  if (process.env.RABBITMQ_URL || process.env.EVENT_BUS_ENABLED === 'true') {
    eventBus.connect().catch((err) => {
      console.warn('[Auth] Event bus unavailable (continuing without):', err.message);
    });
  }

  app.listen(PORT, () => {
    console.log(`FinEra Auth Service: http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start auth service:', err);
  process.exit(1);
});
