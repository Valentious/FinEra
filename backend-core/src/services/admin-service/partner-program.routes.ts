/**
 * FinEra - Partner Program API
 * GET /api/v1/partner-program
 * POST /api/v1/partner-program/apply
 * GET /api/v1/partner-program/status
 */

import { Router } from "express";
import { prisma } from "../../infrastructure/database/index.js";
import { authMiddleware } from "../../middlewares/auth.js";

const router = Router();

router.use(authMiddleware);

/** GET /partner-program - Get overview + user's application status */
router.get("/", async (req, res, next) => {
  try {
    const program = await prisma.partnerProgram.findUnique({
      where: { userId: req.user!.id },
    });
    res.json({
      success: true,
      data: program
        ? {
            id: program.id,
            status: program.status,
            applicationData: program.applicationData as Record<string, unknown>,
            createdAt: program.createdAt,
            updatedAt: program.updatedAt,
          }
        : { status: "NOT_APPLIED", applicationData: null, createdAt: null, updatedAt: null },
    });
  } catch (e) {
    next(e);
  }
});

/** GET /partner-program/status - Alias for status check */
router.get("/status", async (req, res, next) => {
  try {
    const program = await prisma.partnerProgram.findUnique({
      where: { userId: req.user!.id },
      select: { status: true, applicationData: true, updatedAt: true },
    });
    res.json({
      success: true,
      data: {
        status: program?.status ?? "NOT_APPLIED",
        applicationData: program?.applicationData ?? null,
        updatedAt: program?.updatedAt ?? null,
      },
    });
  } catch (e) {
    next(e);
  }
});

/** POST /partner-program/apply - Submit partner application */
router.post("/apply", async (req, res, next) => {
  try {
    const body = req.body as {
      fullName?: string;
      idNumber?: string;
      contactNumber?: string;
      location?: string;
      services?: string[];
    };
    const existing = await prisma.partnerProgram.findUnique({
      where: { userId: req.user!.id },
    });
    if (existing && existing.status === "PENDING") {
      res.status(400).json({ success: false, message: "Application already pending" });
      return;
    }
    if (existing && existing.status === "APPROVED") {
      res.status(400).json({ success: false, message: "Already approved as partner" });
      return;
    }
    const program = await prisma.partnerProgram.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        status: "PENDING",
        applicationData: (body ?? {}) as object,
      },
      update: {
        status: "PENDING",
        applicationData: (body ?? {}) as object,
      },
    });
    res.json({
      success: true,
      data: {
        id: program.id,
        status: program.status,
        applicationData: program.applicationData,
        createdAt: program.createdAt,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
