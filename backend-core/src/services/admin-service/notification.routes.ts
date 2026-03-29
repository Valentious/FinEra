/**
 * FinEra Backend - Notification Routes
 */

import { Router } from "express";
import { prisma } from "../../infrastructure/database/index.js";
import { authMiddleware } from "../../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

/** Mark every unread notification as read (inbox zero). Must be registered before /:id/read. */
router.put("/read-all", async (req, res, next) => {
  try {
    const now = new Date();
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true, readAt: now },
    });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const unreadOnly = req.query.unreadOnly === "true";

    const where: Record<string, unknown> = { userId: req.user!.id };
    if (unreadOnly) where.isRead = false;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      success: true,
      data: { notifications, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (e) {
    next(e);
  }
});

router.put("/:id/read", async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ success: true, message: "Marked as read" });
  } catch (e) {
    next(e);
  }
});

export default router;
