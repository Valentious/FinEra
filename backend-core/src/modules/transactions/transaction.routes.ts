/**
 * FinEra Backend - Transaction Routes
 */

import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/database/index.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { fraudDetectionMiddleware } from "../../application/middlewares/fraud-detection.middleware.js";
import { z } from "zod";
import { validationError } from "../../middlewares/errorHandler.js";

const router = Router();

router.use(authMiddleware);

const depositSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["USD", "ZIG", "ZAR", "EUR"]),
  paymentMethod: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

const withdrawSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["USD", "ZIG", "ZAR", "EUR"]),
  withdrawalMethod: z.string(),
  accountDetails: z.record(z.unknown()).optional(),
});

router.post("/deposit", fraudDetectionMiddleware, async (req, res, next) => {
  try {
    const parsed = depositSchema.safeParse(req.body);
    if (!parsed.success) throw validationError("Validation failed");
    const { amount, currency, metadata } = parsed.data;
    const fee = 0;
    const netAmount = amount - fee;

    const wallet = await prisma.wallet.findFirst({
      where: { userId: req.user!.id, currencyCode: currency },
    });
    if (!wallet) throw validationError("Wallet not found for currency");

    const reference = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

    const txn = await prisma.transaction.create({
      data: {
        userId: req.user!.id,
        walletId: wallet.id,
        reference,
        transactionType: "DEPOSIT",
        amount,
        fee,
        netAmount,
        currency,
        status: "PENDING",
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    res.status(202).json({
      success: true,
      data: { transactionId: txn.id, status: txn.status, reference, instructions: "Complete payment on your device" },
    });
  } catch (e) {
    next(e);
  }
});

router.post("/withdraw", fraudDetectionMiddleware, async (req, res, next) => {
  try {
    const parsed = withdrawSchema.safeParse(req.body);
    if (!parsed.success) throw validationError("Validation failed");
    const { amount, currency, withdrawalMethod, accountDetails } = parsed.data;
    const fee = 0;
    const netAmount = amount - fee;

    const wallet = await prisma.wallet.findFirst({
      where: { userId: req.user!.id, currencyCode: currency },
    });
    if (!wallet) throw validationError("Wallet not found");
    if (Number(wallet.balance) < amount) throw validationError("Insufficient balance");

    const reference = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

    const txn = await prisma.transaction.create({
      data: {
        userId: req.user!.id,
        walletId: wallet.id,
        reference,
        transactionType: "WITHDRAWAL",
        amount,
        fee,
        netAmount,
        currency,
        status: "PENDING",
        metadata: { withdrawalMethod, accountDetails: accountDetails ?? {} } as Prisma.InputJsonValue,
      },
    });

    res.status(202).json({
      success: true,
      data: { transactionId: txn.id, status: txn.status, reference, estimatedCompletion: "1-24 hours" },
    });
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const type = req.query.type as string | undefined;
    const status = req.query.status as string | undefined;

    const where: Record<string, unknown> = { userId: req.user!.id };
    if (type) where.transactionType = type;
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      success: true,
      data: { transactions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const txn = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!txn) throw validationError("Transaction not found");
    res.json({ success: true, data: txn });
  } catch (e) {
    next(e);
  }
});

export default router;
