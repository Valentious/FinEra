import { Router } from "express";
import { prisma } from "../../infrastructure/database/index.js";
import { adminAuthMiddleware, requireAdminRole } from "../../middlewares/adminAuth.js";
import { getRecentDomainEvents } from "../../infrastructure/messaging/event-bus.js";
import { logger } from "../../core/utils/logger.js";

const router = Router();

router.use(adminAuthMiddleware);

router.use((req, _res, next) => {
  if (req.admin) {
    logger.info({
      adminId: req.admin.id,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }
  next();
});

router.get("/overview", requireAdminRole("ADMIN", "RISK_OFFICER", "AUDITOR"), async (_req, res, next) => {
  try {
    const [totalUsers, activeLoans, defaultedLoans, loansForRate] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.loan.count({ where: { status: "ACTIVE" } }),
      prisma.loan.count({ where: { status: "DEFAULTED" } }),
      prisma.loan.count(),
    ]);
    const denom = loansForRate > 0 ? loansForRate : 1;
    const defaultRate = defaultedLoans / denom;

    const riskRows = await prisma.creditProfile.groupBy({
      by: ["riskLevel"],
      _count: { _all: true },
    });
    const riskDistribution = riskRows.map((r) => ({
      level: r.riskLevel,
      count: r._count._all,
    }));

    const fraudOpen = await prisma.fraudLog.count({ where: { resolved: false } });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeLoans,
        defaultRate,
        riskDistribution,
        openFraudFlags: fraudOpen,
        systemHealth: "operational",
      },
    });
  } catch (e) {
    next(e);
  }
});

router.get("/activity", requireAdminRole("ADMIN", "RISK_OFFICER", "AUDITOR"), async (_req, res, next) => {
  try {
    const events = await getRecentDomainEvents(80);
    res.json({ success: true, data: { events } });
  } catch (e) {
    next(e);
  }
});

router.get("/audit-logs", requireAdminRole("ADMIN", "AUDITOR"), async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const logs = await prisma.adminAuditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: limit,
      include: { admin: { select: { email: true, fullName: true, role: true } } },
    });
    res.json({ success: true, data: { logs } });
  } catch (e) {
    next(e);
  }
});

router.get("/services/health", requireAdminRole("ADMIN", "RISK_OFFICER", "AUDITOR"), async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      data: {
        api: "ok",
        database: "ok",
        redis: process.env.REDIS_URL ? "configured" : "optional",
        broker: process.env.RABBITMQ_URL ? "configured" : "optional",
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
