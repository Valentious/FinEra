/**
 * FinEra Admin Dashboard - Production-grade metrics
 * Real-time capital, users, risk, transactions
 */

import { Router, type Request, type Response } from 'express';
import { db } from '@finera/database';

export const dashboardRoutes = Router();

export interface DashboardMetrics {
  capital: {
    total: number;
    liquid: number;
    reserved: number;
    availableForLoans: number;
    capitalReserveRatio: number;
  };
  users: {
    total: number;
    active: number;
    newToday: number;
    byType: { STUDENT: number; STAFF: number; ALUMNI: number };
  };
  wallets: {
    active: number;
    totalBalance: number;
    avgBalance: number;
  };
  credit: {
    totalScored: number;
    defaultRate: number;
    byRiskTier: Record<string, { count: number; value: number }>;
    portfolioRiskScore: number;
  };
  transactions: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    completed: number;
    avgValue: number;
  };
  risk: {
    portfolioRiskScore: number;
    exposurePercentage: number;
    emergencyExposureCap: number;
    currentExposure: number;
  };
}

async function getLendingCap(): Promise<number> {
  try {
    const config = await db.getClient().systemConfig.findUnique({
      where: { key: 'LENDING_CAP' },
    });
    return config ? (config.value as number) : 100000;
  } catch {
    return 100000;
  }
}

dashboardRoutes.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const prisma = db.getClient();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setMonth(monthStart.getMonth() - 1);

    const [
      userCount,
      usersByRole,
      usersToday,
      wallets,
      creditScores,
      transactions,
      completedTx,
    ] = await Promise.all([
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.groupBy({ by: ['role'], where: { status: 'ACTIVE' }, _count: { id: true } }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.wallet.findMany({
        where: { status: 'ACTIVE' },
        select: { balance: true },
      }),
      prisma.creditScore.findMany({ select: { riskLevel: true, overallScore: true } }),
      prisma.transaction.findMany({
        where: { status: 'COMPLETED' },
        select: { amount: true, createdAt: true, type: true },
      }),
      prisma.transaction.count({ where: { status: 'COMPLETED' } }),
    ]);

    const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
    const byRole = usersByRole.reduce((acc, r) => {
      acc[r.role as string] = r._count.id;
      return acc;
    }, {} as Record<string, number>);

    const txToday = transactions.filter((t) => new Date(t.createdAt) >= todayStart).length;
    const txWeek = transactions.filter((t) => new Date(t.createdAt) >= weekStart).length;
    const txMonth = transactions.filter((t) => new Date(t.createdAt) >= monthStart).length;
    const txAmounts = transactions.map((t) => Math.abs(Number(t.amount)));
    const avgTxValue = txAmounts.length ? txAmounts.reduce((a, b) => a + b, 0) / txAmounts.length : 0;

    const riskByTier = creditScores.reduce(
      (acc, { riskLevel }) => {
        if (!acc[riskLevel]) acc[riskLevel] = { count: 0, value: 0 };
        acc[riskLevel].count++;
        acc[riskLevel].value += 1;
        return acc;
      },
      {} as Record<string, { count: number; value: number }>
    );

    const portfolioRiskScore =
      creditScores.length > 0
        ? Math.round(
            creditScores.reduce((sum, s) => sum + s.overallScore, 0) / creditScores.length
          )
        : 50;

    const lendingCap = await getLendingCap();
    const totalCapital = Math.max(totalBalance, lendingCap);
    const liquidCapital = totalCapital * 0.7;
    const reservedCapital = totalCapital * 0.3;
    const availableForLoans = Math.min(liquidCapital * 0.8, lendingCap);
    const emergencyCap = totalCapital * 0.15;
    const currentExposure = totalBalance;

    const metrics: DashboardMetrics = {
      capital: {
        total: totalCapital,
        liquid: liquidCapital,
        reserved: reservedCapital,
        availableForLoans,
        capitalReserveRatio: (reservedCapital / totalCapital) * 100,
      },
      users: {
        total: userCount,
        active: userCount,
        newToday: usersToday,
        byType: {
          STUDENT: byRole.STUDENT ?? 0,
          STAFF: byRole.STAFF ?? 0,
          ALUMNI: byRole.ALUMNI ?? 0,
        },
      },
      wallets: {
        active: wallets.length,
        totalBalance,
        avgBalance: wallets.length ? totalBalance / wallets.length : 0,
      },
      credit: {
        totalScored: creditScores.length,
        defaultRate: 0,
        byRiskTier: {
          LOW: riskByTier.LOW ?? { count: 0, value: 0 },
          MEDIUM: riskByTier.MEDIUM ?? { count: 0, value: 0 },
          HIGH: riskByTier.HIGH ?? { count: 0, value: 0 },
          CRITICAL: riskByTier.CRITICAL ?? { count: 0, value: 0 },
          EXCELLENT: riskByTier.EXCELLENT ?? { count: 0, value: 0 },
        },
        portfolioRiskScore,
      },
      transactions: {
        total: transactions.length,
        today: txToday,
        thisWeek: txWeek,
        thisMonth: txMonth,
        completed: completedTx,
        avgValue: avgTxValue,
      },
      risk: {
        portfolioRiskScore,
        exposurePercentage: totalCapital ? (currentExposure / totalCapital) * 100 : 0,
        emergencyExposureCap: emergencyCap,
        currentExposure,
      },
    };

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Dashboard metrics error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard metrics' });
  }
});
