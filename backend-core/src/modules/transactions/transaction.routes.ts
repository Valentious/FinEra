/**
 * FinEra Backend - Transaction Routes
 * Delegates to transaction.service for atomic operations.
 * All request/response validated with Zod.
 */

import { Router } from "express";
import { prisma } from "../../infrastructure/database/index.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { fraudDetectionMiddleware } from "../../application/middlewares/fraud-detection.middleware.js";
import {
  validateDepositInput,
  validateWithdrawInput,
} from "../wallet/wallet.service.js";
import {
  processDeposit,
  processWithdrawal,
  listTransactions,
} from "../wallet/transaction.service.js";
import { z } from "zod";
import { validationError } from "../../middlewares/errorHandler.js";

const router = Router();
router.use(authMiddleware);

const CURRENCIES = ["USD", "ZIG", "ZAR", "EUR", "GBP"] as const;
const transactionsQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
  type: z.enum(["DEPOSIT", "WITHDRAWAL", "PAYMENT", "LOAN_DISBURSEMENT", "LOAN_REPAYMENT", "FEE", "INTEREST", "TRANSFER"]).optional(),
  status: z.string().optional(),
  currency: z.enum(CURRENCIES),
});

router.post("/deposit", fraudDetectionMiddleware, async (req, res, next) => {
  try {
    const input = validateDepositInput(req.body);
    const result = await processDeposit(req.user!.id, input);
    res.status(201).json({
      success: true,
      data: {
        transactionId: result.transactionId,
        reference: result.reference,
        newBalance: result.newBalance,
        transaction: result.transaction,
        status: "COMPLETED",
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post("/withdraw", fraudDetectionMiddleware, async (req, res, next) => {
  try {
    const input = validateWithdrawInput(req.body);
    const result = await processWithdrawal(req.user!.id, input);
    res.status(201).json({
      success: true,
      data: {
        transactionId: result.transactionId,
        reference: result.reference,
        newBalance: result.newBalance,
        transaction: result.transaction,
        status: "COMPLETED",
      },
    });
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const parsed = transactionsQuerySchema.safeParse(req.query);
    if (!parsed.success) throw validationError("Invalid query", { zod: parsed.error.flatten() });
    const { page, limit, type, status, currency } = parsed.data;

    const result = await listTransactions(req.user!.id, {
      page,
      limit,
      type: type as import("@prisma/client").TransactionType | undefined,
      status,
      currency: currency as import("@prisma/client").CurrencyCode,
    });

    res.json({
      success: true,
      data: {
        transactions: result.transactions.map((t) => ({
          id: t.id,
          reference: t.reference,
          type: t.transactionType,
          amount: Number(t.amount),
          fee: Number(t.fee),
          netAmount: Number(t.netAmount),
          currency: t.currency,
          status: t.status,
          createdAt: t.createdAt,
          completedAt: t.completedAt,
        })),
        pagination: result.pagination,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const idSchema = z.object({ id: z.string().uuid() });
    const parsed = idSchema.safeParse({ id: req.params.id });
    if (!parsed.success) throw validationError("Invalid transaction ID");

    const txn = await prisma.transaction.findFirst({
      where: { id: parsed.data.id, userId: req.user!.id },
    });
    if (!txn) throw validationError("Transaction not found");
    res.json({ success: true, data: txn });
  } catch (e) {
    next(e);
  }
});

export default router;
