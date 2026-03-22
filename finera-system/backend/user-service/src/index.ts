/**
 * FinEra User Service - Profile management
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '../../database/.env') });
import express from 'express';
import cors from 'cors';
import { db } from '@finera/database';
import { userRoutes } from './routes/user.js';

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'user-service' }));
app.use('/api/v1/users', userRoutes);

async function start() {
  await db.connect();
  app.listen(PORT, () => console.log(`FinEra User Service: http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start user service:', err);
  process.exit(1);
});
