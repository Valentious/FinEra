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
import { zodErrorToFieldErrors } from "../../shared/validation/zod-format.js";
import { getWalletLabel } from "../../shared/wallet-label.js";
import { allocateWalletNumericId } from "../../infrastructure/ledger/wallet-numeric-id.js";

const router = Router();

router.use(authMiddleware);

const profileSelect = {
  id: true,
  email: true,
  fullName: true,
  title: true,
  preferredLanguage: true,
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

const profileSelectWithMeta = { ...profileSelect, metadata: true } satisfies Prisma.UserSelect;

/** Flatten auth + metadata for API (exposes accountMode from metadata, never raw metadata). */
function finalizeProfilePayload(raw: Record<string, unknown>) {
  if (raw.authCredentials) {
    raw.lastLoginAt = (raw.authCredentials as { lastLoginAt?: Date | null }).lastLoginAt;
    delete raw.authCredentials;
  }
  if ("metadata" in raw) {
    const meta = raw.metadata as Record<string, unknown> | null | undefined;
    const mode = meta?.accountMode === "demo" ? "demo" : "real";
    delete raw.metadata;
    raw.accountMode = mode;
  }
  if (raw.dateOfBirth instanceof Date) {
    raw.dateOfBirth = (raw.dateOfBirth as Date).toISOString().slice(0, 10);
  }
}

router.get("/profile", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: profileSelectWithMeta,
    });
    if (!user) throw notFoundError("User not found");

    const raw = user as Record<string, unknown>;
    finalizeProfilePayload(raw);

    res.json({ success: true, data: user });
  } catch (e) {
    next(e);
  }
});

router.put("/profile", async (req, res, next) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validationError("Validation failed", { fields: zodErrorToFieldErrors(parsed.error) });
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
    if (body.title !== undefined) data.title = body.title;
    if (body.preferredLanguage !== undefined) data.preferredLanguage = body.preferredLanguage;
    if (body.city !== undefined) data.city = body.city;
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
        select: profileSelectWithMeta,
      });
      const raw = user as Record<string, unknown>;
      finalizeProfilePayload(raw);
      return res.json({ success: true, data: user });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: profileSelectWithMeta,
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

    const raw = user as Record<string, unknown>;
    finalizeProfilePayload(raw);

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
    const [wallets, loanOutstandingByWallet] = await Promise.all([
      prisma.wallet.findMany({
        where,
        select: {
          id: true,
          currencyCode: true,
          accountNumber: true,
          walletNumericId: true,
          balance: true,
          availableBalance: true,
          approvedCreditBalance: true,
          activeLoanBalance: true,
        },
      }),
      prisma.loan.groupBy({
        by: ["walletId"],
        where: { userId: req.user!.id, status: "ACTIVE" },
        _sum: { remainingBalance: true },
      }),
    ]);
    const outstandingByWalletId = Object.fromEntries(
      loanOutstandingByWallet.map((g) => [g.walletId, Number(g._sum.remainingBalance ?? 0)])
    );
    const withNumericIds = await Promise.all(
      wallets.map(async (w) => {
        if (w.walletNumericId) return w;
        const nid = await prisma.$transaction(async (tx) => {
          const cur = await tx.wallet.findUnique({ where: { id: w.id }, select: { walletNumericId: true } });
          if (cur?.walletNumericId) return cur.walletNumericId;
          const allocated = await allocateWalletNumericId(tx);
          await tx.wallet.update({ where: { id: w.id }, data: { walletNumericId: allocated } });
          return allocated;
        });
        return { ...w, walletNumericId: nid };
      })
    );
    const data = withNumericIds.map((w) => {
      const activeLoanBalance = outstandingByWalletId[w.id] ?? 0;
      const wb = Number(w.balance);
      return {
        id: w.id,
        currency: w.currencyCode,
        currencyCode: w.currencyCode,
        walletLabel: getWalletLabel(w.currencyCode),
        accountNumber: w.accountNumber,
        walletNumericId: w.walletNumericId ?? "",
        balance: wb,
        availableBalance: Number(w.availableBalance),
        approvedCreditBalance: Number(w.approvedCreditBalance),
        activeLoanBalance,
      };
    });
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

export default router;
