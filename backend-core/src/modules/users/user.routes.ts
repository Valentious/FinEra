/**
 * FinEra Backend - User Routes
 */

import { Router } from "express";
import { prisma } from "../../infrastructure/database/index.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { notFoundError } from "../../middlewares/errorHandler.js";

const router = Router();

router.use(authMiddleware);

router.get("/profile", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        fullName: true,
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
      },
    });
    if (user?.authCredentials) {
      (user as Record<string, unknown>).lastLoginAt = user.authCredentials.lastLoginAt;
      delete (user as Record<string, unknown>).authCredentials;
    }
    if (!user) throw notFoundError("User not found");
    res.json({ success: true, data: user });
  } catch (e) {
    next(e);
  }
});

router.get("/wallets", async (req, res, next) => {
  try {
    const currency = req.query.currency as string | undefined;
    const where: { userId: string; isActive: boolean; currencyCode?: import("@prisma/client").CurrencyCode } = { userId: req.user!.id, isActive: true };
    if (currency && ["USD", "ZIG", "ZAR", "EUR", "GBP", "USDT"].includes(currency)) {
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
