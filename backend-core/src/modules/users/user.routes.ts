/**
 * FinEra Backend - User Routes (profile, wallets)
 */

import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/index.js";
import { authMiddleware } from "../../middlewares/auth.js";
import {
  notFoundError,
  validationError,
  forbiddenError,
  conflictError,
} from "../../middlewares/errorHandler.js";
import { updateProfileSchema } from "./user.validation.js";
import { logger } from "../../core/utils/logger.js";

const router = Router();

router.use(authMiddleware);

const profileSelect = {
  id: true,
  email: true,
  fullName: true,
  dateOfBirth: true,
  dateOfBirthLocked: true,
  phoneNumber: true,
  accountType: true,
  accountTier: true,
  countryCode: true,
  city: true,
  institution: true,
  emailVerified: true,
  createdAt: true,
  authCredentials: {
    select: { lastLoginAt: true },
  },
} satisfies Prisma.UserSelect;

router.get("/profile", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: profileSelect,
    });
    if (user?.authCredentials) {
      (user as Record<string, unknown>).lastLoginAt = user.authCredentials.lastLoginAt;
      delete (user as Record<string, unknown>).authCredentials;
    }
    if (!user) throw notFoundError("User not found");

    const raw = user as Record<string, unknown>;
    if (raw.dateOfBirth instanceof Date) {
      raw.dateOfBirth = (raw.dateOfBirth as Date).toISOString().slice(0, 10);
    }

    res.json({ success: true, data: user });
  } catch (e) {
    next(e);
  }
});

router.put("/profile", async (req, res, next) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const msg = Object.values(first).flat()[0] || "Validation failed";
      throw validationError(typeof msg === "string" ? msg : "Validation failed", first as Record<string, unknown>);
    }

    const userId = req.user!.id;
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        dateOfBirthLocked: true,
        phoneNumber: true,
      },
    });
    if (!existing) throw notFoundError("User not found");

    const body = parsed.data;
    if (body.dateOfBirth !== undefined) {
      if (existing.dateOfBirthLocked) {
        throw forbiddenError("Date of birth is locked after verification. Contact support to change it.");
      }
    }

    const data: Prisma.UserUpdateInput = {};
    if (body.fullName !== undefined) data.fullName = body.fullName;
    if (body.phoneNumber !== undefined && body.phoneNumber !== existing.phoneNumber) {
      const taken = await prisma.user.findFirst({
        where: { phoneNumber: body.phoneNumber, NOT: { id: userId } },
        select: { id: true },
      });
      if (taken) throw conflictError("Phone number already in use");
      data.phoneNumber = body.phoneNumber;
    }
    if (body.dateOfBirth !== undefined) {
      data.dateOfBirth = new Date(`${body.dateOfBirth}T12:00:00`);
    }

    if (Object.keys(data).length === 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: profileSelect,
      });
      if (user?.authCredentials) {
        (user as Record<string, unknown>).lastLoginAt = user.authCredentials.lastLoginAt;
        delete (user as Record<string, unknown>).authCredentials;
      }
      const raw = user as Record<string, unknown>;
      if (raw.dateOfBirth instanceof Date) {
        raw.dateOfBirth = (raw.dateOfBirth as Date).toISOString().slice(0, 10);
      }
      return res.json({ success: true, data: user });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: profileSelect,
    });

    if (body.dateOfBirth !== undefined) {
      const y = new Date(`${body.dateOfBirth}T12:00:00`).getFullYear();
      logger.info(
        {
          audit: "pii_dob_submission",
          userId,
          dobYear: y,
          sensitive: "dob",
        },
        "DOB profile update (year only; full value never logged)"
      );
    }

    if (user.authCredentials) {
      (user as Record<string, unknown>).lastLoginAt = user.authCredentials.lastLoginAt;
      delete (user as Record<string, unknown>).authCredentials;
    }
    const raw = user as Record<string, unknown>;
    if (raw.dateOfBirth instanceof Date) {
      raw.dateOfBirth = (raw.dateOfBirth as Date).toISOString().slice(0, 10);
    }

    return res.json({ success: true, data: user });
  } catch (e) {
    next(e);
    return;
  }
});

router.get("/wallets", async (req, res, next) => {
  try {
    const currency = req.query.currency as string | undefined;
    const where: { userId: string; isActive: boolean; currencyCode?: import("@prisma/client").CurrencyCode } = {
      userId: req.user!.id,
      isActive: true,
    };
    if (currency && ["USD", "ZIG", "ZAR", "EUR", "GBP"].includes(currency)) {
      where.currencyCode = currency as import("@prisma/client").CurrencyCode;
    }
    const wallets = await prisma.wallet.findMany({
      where,
      select: {
        id: true,
        currencyCode: true,
        accountNumber: true,
        balance: true,
        savingsBalance: true,
        approvedCreditBalance: true,
        activeLoanBalance: true,
      },
    });
    res.json({ success: true, data: wallets });
  } catch (e) {
    next(e);
  }
});

export default router;
