/**
 * System Health - Database, services
 */

import { Router, type Request, type Response } from 'express';
import { db } from '@finera/database';

export const healthRoutes = Router();

async function checkDatabase() {
  try {
    await db.getClient().$queryRaw`SELECT 1`;
    return { status: 'healthy' as const };
  } catch (err) {
    return { status: 'unhealthy' as const, error: (err as Error).message };
  }
}

healthRoutes.get('/', async (_req: Request, res: Response) => {
  try {
    const database = await checkDatabase();

    res.json({
      success: true,
      data: {
        database,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      data: { database: { status: 'unhealthy' } },
    });
  }
});
