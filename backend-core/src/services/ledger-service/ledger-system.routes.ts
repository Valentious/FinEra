/**
 * Ledger API — balances from journal lines; history; admin credit (via engine).
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../infrastructure/database/index.js";
import type { CurrencyCode } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth.js";
import { adminAuthMiddleware, requireAdminRole } from "../../middlewares/adminAuth.js";
import { validationError } from "../../middlewares/errorHandler.js";
import { getWalletBalanceFromLedger } from "./ledger-balance.service.js";
import { processDeposit } from "./transaction.service.js";
import { publishDomainEvent } from "../../infrastructure/messaging/event-bus.js";
import { generateReference } from "./transaction-engine.service.js";
import { runLedgerIntegrityCheck } from "./ledger-integrity.service.js";
import { logger } from "../../core/utils/logger.js";

const router = Router();

const currencyEnum = z.enum(["USD", "ZIG", "ZAR", "EUR", "GBP"]);

router.get("/balance", authMiddleware, async (req, res, next) => {
  try {
    const q = z.object({ currency: currencyEnum }).parse(req.query);
    const userId = req.user!.id;
    const wallet = await prisma.wallet.findFirst({
      where: { userId, currencyCode: q.currency as CurrencyCode, isActive: true },
    });
    if (!wallet) {
      throw validationError(`No wallet for ${q.currency}`);
    }
    const { balance } = await getWalletBalanceFromLedger(wallet.id, q.currency as CurrencyCode);
    res.json({
      success: true,
      data: {
        userId,
        walletId: wallet.id,
        currency: q.currency,
        balance,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.get("/balance/:targetUserId", adminAuthMiddleware, requireAdminRole("ADMIN", "RISK_OFFICER", "AUDITOR"), async (req, res, next) => {
  try {
    const q = z.object({ currency: currencyEnum }).parse(req.query);
    const { targetUserId } = z.object({ targetUserId: z.string().uuid() }).parse(req.params);
    const wallet = await prisma.wallet.findFirst({
      where: { userId: targetUserId, currencyCode: q.currency as CurrencyCode, isActive: true },
    });
    if (!wallet) {
      throw validationError(`No wallet for user ${targetUserId} / ${q.currency}`);
    }
    const { balance } = await getWalletBalanceFromLedger(wallet.id, q.currency as CurrencyCode);
    res.json({
      success: true,
      data: {
        userId: targetUserId,
        walletId: wallet.id,
        currency: q.currency,
        balance,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.get("/history", authMiddleware, async (req, res, next) => {
  try {
    const q = z
      .object({
        currency: currencyEnum,
        limit: z.coerce.number().min(1).max(100).optional().default(50),
      })
      .parse(req.query);
    const userId = req.user!.id;
    const wallet = await prisma.wallet.findFirst({
      where: { userId, currencyCode: q.currency as CurrencyCode },
    });
    if (!wallet) {
      throw validationError(`No wallet for ${q.currency}`);
    }
    const txs = await prisma.transaction.findMany({
      where: { userId, walletId: wallet.id, currency: q.currency as CurrencyCode },
      orderBy: { createdAt: "desc" },
      take: q.limit,
      select: {
        id: true,
        reference: true,
        transactionType: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        ledgerPreviousHash: true,
        ledgerEntryHash: true,
        ledgerDebitAccount: true,
        ledgerCreditAccount: true,
      },
    });
    res.json({ success: true, data: { transactions: txs } });
  } catch (e) {
    next(e);
  }
});

router.get(
  "/integrity-check",
  adminAuthMiddleware,
  requireAdminRole("ADMIN", "AUDITOR"),
  async (req, res, next) => {
    try {
      const q = z.object({ ledgerId: z.string().uuid().optional() }).parse(req.query);
      const result = await runLedgerIntegrityCheck(q.ledgerId);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }
);

const adminJournalBody = z.object({
  userId: z.string().uuid(),
  currency: currencyEnum,
  amount: z.number().positive(),
  memo: z.string().max(500).optional(),
  confirmationReason: z.string().min(3).max(2000),
});

/** Credit user via same path as member deposit — double-entry + hash seal inside engine. */
router.post("/journal", adminAuthMiddleware, requireAdminRole("ADMIN"), async (req, res, next) => {
  try {
    const body = adminJournalBody.parse(req.body);
    const currency = body.currency as CurrencyCode;
    const reference = `ADM-${generateReference()}`;
    const result = await processDeposit(body.userId, {
      amount: body.amount,
      currency,
      referenceId: reference,
      metadata: {
        adminJournal: true,
        adminId: req.admin!.id,
        memo: body.memo ?? null,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        action: "LEDGER_ADMIN_CREDIT",
        entityType: "Transaction",
        entityId: result.transactionId,
        currency,
        newValues: {
          amount: body.amount,
          memo: body.memo,
          reference: result.reference,
          confirmationReason: body.confirmationReason,
        },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] ?? null,
      },
    });

    logger.info(
      {
        adminId: req.admin!.id,
        action: "LEDGER_ADMIN_CREDIT",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        entityId: result.transactionId,
      },
      "admin sensitive action"
    );

    await publishDomainEvent("ADMIN_ACTION", {
      action: "LEDGER_ADMIN_CREDIT",
      transactionId: result.transactionId,
      adminId: req.admin!.id,
      userId: body.userId,
      currency,
    });

    res.status(201).json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

export default router;
