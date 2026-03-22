/**
 * Admin User Management - List, filter, suspend
 */

import { Router, type Request, type Response } from 'express';
import { db } from '@finera/database';

export const usersRoutes = Router();

usersRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const { status, role, page = '1', limit = '50', search } = req.query;
    const prisma = db.getClient();

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (role) where.role = role;
    if (search && typeof search === 'string') {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
          wallet: { select: { balance: true, status: true } },
          creditScore: { select: { overallScore: true, riskLevel: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.user.count({ where }),
    ]);

    const usersWithBalance = users.map((u) => ({
      ...u,
      walletBalance: u.wallet ? Number(u.wallet.balance) : 0,
      meetsMinimumBalance: u.wallet ? Number(u.wallet.balance) >= 100 : true,
    }));

    res.json({
      success: true,
      data: usersWithBalance,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err) {
    console.error('Users fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

usersRoutes.post('/:userId/suspend', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const prisma = db.getClient();

    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
    });

    if (user.wallet) {
      await prisma.wallet.updateMany({
        where: { userId },
        data: { status: 'FROZEN' },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.headers['x-user-id'] as string || 'system',
        action: 'USER_SUSPENDED',
        entityType: 'User',
        entityId: userId,
        newValues: { reason: reason || 'Admin action', timestamp: new Date().toISOString() },
      },
    });

    res.json({
      success: true,
      message: 'User suspended successfully',
      data: user,
    });
  } catch (err) {
    console.error('User suspend error:', err);
    res.status(500).json({ success: false, error: 'Failed to suspend user' });
  }
});
