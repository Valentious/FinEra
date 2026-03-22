/**
 * FinEra Admin Service - Audit logging, stats
 * POST /audit (orchestration), GET /audit/:userId
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { db } from '@finera/database';

export const adminRoutes = Router();

const auditSchema = z.object({
  userId: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

adminRoutes.post('/audit', async (req: Request, res: Response) => {
  try {
    const validatedData = auditSchema.parse(req.body);
    const prisma = db.getClient();

    const auditLog = await prisma.auditLog.create({
      data: {
        userId: validatedData.userId,
        action: validatedData.action,
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        newValues: (validatedData.metadata as object) ?? {},
        status: 'SUCCESS',
      },
    });

    res.status(201).json({
      success: true,
      data: {
        logId: auditLog.id,
        action: auditLog.action,
        timestamp: auditLog.createdAt,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: err.errors });
    }
    console.error('Audit logging error:', err);
    res.status(500).json({ success: false, error: 'Audit logging failed' });
  }
});

adminRoutes.get('/audit/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = '100', offset = '0' } = req.query;

    const logs = await db.getClient().auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    res.json({
      success: true,
      data: logs,
      pagination: { limit: Number(limit), offset: Number(offset), total: logs.length },
    });
  } catch (err) {
    console.error('Audit fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});

adminRoutes.get('/stats', async (_req: Request, res: Response) => {
  try {
    const prisma = db.getClient();
    const [totalUsers, creditScores, walletCount] = await Promise.all([
      prisma.user.count(),
      prisma.creditScore.findMany({ select: { riskLevel: true } }),
      prisma.wallet.count(),
    ]);

    const riskDistribution = creditScores.reduce(
      (acc, { riskLevel }) => {
        acc[riskLevel] = (acc[riskLevel] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    res.json({
      success: true,
      data: {
        totalUsers,
        activeLoans: walletCount,
        defaultRate: 0,
        riskDistribution: {
          LOW: riskDistribution.LOW ?? 0,
          MEDIUM: riskDistribution.MEDIUM ?? 0,
          HIGH: riskDistribution.HIGH ?? 0,
          CRITICAL: riskDistribution.CRITICAL ?? 0,
          EXCELLENT: riskDistribution.EXCELLENT ?? 0,
        },
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

adminRoutes.get('/activity', async (_req: Request, res: Response) => {
  try {
    const logs = await db.getClient().auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });

    res.json({
      success: true,
      data: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        userId: log.userId,
        userEmail: log.user?.email,
        userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : null,
        timestamp: log.createdAt,
      })),
    });
  } catch (err) {
    console.error('Activity error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch activity' });
  }
});

adminRoutes.get('/audit', async (req: Request, res: Response) => {
  try {
    const { limit = '50', offset = '0' } = req.query;
    const [logs, total] = await Promise.all([
      db.getClient().auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
        include: { user: { select: { email: true } } },
      }),
      db.getClient().auditLog.count(),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: { limit: Number(limit), offset: Number(offset), total },
    });
  } catch (err) {
    console.error('Audit list error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});
