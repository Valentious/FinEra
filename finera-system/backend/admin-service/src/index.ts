/**
 * FinEra Admin Service - Audit, stats
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '../../database/.env') });
import express from 'express';
import cors from 'cors';
import { db } from '@finera/database';
import { adminRoutes } from './routes/admin.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { usersRoutes } from './routes/users.js';
import { healthRoutes } from './routes/health.js';

const app = express();
const PORT = process.env.PORT || 4006;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'admin-service' }));
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin/dashboard', dashboardRoutes);
app.use('/api/v1/admin/users', usersRoutes);
app.use('/api/v1/admin/system', healthRoutes);

async function start() {
  await db.connect();
  app.listen(PORT, () => console.log(`FinEra Admin Service: http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start admin service:', err);
  process.exit(1);
});
