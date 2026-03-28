/**
 * FinEra Backend - Credit Routes
 */

import { Router } from "express";
import { prisma } from "../../infrastructure/database/index.js";
import { authMiddleware } from "../../middlewares/auth.js";
import * as creditService from "./credit.service.js";
import { processLoanDisbursement } from "../ledger-service/transaction.service.js";
import { assertWalletHasNoActiveLoan } from "../ledger-service/loan-invariants.js";
import { z } from "zod";
import { validationError } from "../../middlewares/errorHandler.js";
import { assignLoanInterestRatePercent } from "../../shared/validation/rules.js";
import { loanPrincipalSchema } from "../../shared/validation/zod-schemas.js";
import { zodErrorToFieldErrors } from "../../shared/validation/zod-format.js";

const router = Router();

router.use(authMiddleware);

const applySchema = z.object({
  amount: loanPrincipalSchema,
  currency: z.enum(["USD", "ZIG", "ZAR", "EUR", "GBP"]),
  term: z.number().int().min(1).max(60).optional(),
  creditType: z.enum(["essential", "emergency", "business"]).optional(),
  withCollateral: z.boolean().optional().default(false),
});

router.get("/score", async (req, res, next) => {
  try {
    const { score, factors } = await creditService.calculateCreditScore(req.user!.id);
    res.json({ success: true, data: { score, factors, lastUpdated: new Date() } });
  } catch (e) {
    next(e);
  }
});

const currencyQuery = z.enum(["USD", "ZIG", "ZAR", "EUR", "GBP"]).optional();

router.get("/limit", async (req, res, next) => {
  try {
    const q = currencyQuery.safeParse(req.query.currency);
    const currency = q.success ? q.data : undefined;
    const result = await creditService.calculateCreditLimit(req.user!.id, currency ? { currency } : undefined);
    res.json({
      success: true,
      data: {
        creditLimit: result.creditLimit,
        availableCredit: result.availableCredit,
        financialDisciplineScore: result.financialDisciplineScore,
        currency: currency ?? "USD",
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post("/apply", async (req, res, next) => {
  try {
    const parsed = applySchema.safeParse(req.body);
    if (!parsed.success) {
      throw validationError("Validation failed", { fields: zodErrorToFieldErrors(parsed.error) });
    }
    const { amount, currency } = parsed.data;
    const term = parsed.data.term ?? 12;

    const limitResult = await creditService.calculateCreditLimit(req.user!.id, { currency });
    const available = Number(limitResult.availableCredit);
    if (amount > available) {
      throw validationError("Amount exceeds available credit", {
        fields: [{ field: "amount", error: "Amount exceeds available credit" }],
      });
    }

    const interestRatePct = assignLoanInterestRatePercent(amount);

    const wallet = await prisma.wallet.findFirst({
      where: { userId: req.user!.id, currencyCode: currency },
      select: { id: true },
    });
    if (!wallet) throw validationError("Wallet not found");

    await assertWalletHasNoActiveLoan(prisma, wallet.id);

    const rateDecimal = interestRatePct / 100;
    const totalInterest = amount * rateDecimal * (term / 12);
    const fees = 0;
    const totalRepayable = amount + totalInterest + fees;
    const installmentAmount = totalRepayable / term;
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + term);

    const loanNumber = `LN-${new Date().toISOString().slice(0, 7).replace(/-/, "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const application = await prisma.loan.create({
      data: {
        loanNumber,
        userId: req.user!.id,
        walletId: wallet.id,
        principalAmount: amount,
        interestRate: interestRatePct,
        totalInterest,
        fees,
        totalRepayable,
        amountDisbursed: 0,
        remainingBalance: totalRepayable,
        currency,
        term,
        installmentAmount,
        maturityDate,
        status: "PENDING",
      },
    });

    res.status(202).json({
      success: true,
      data: {
        applicationId: application.id,
        loanNumber: application.loanNumber,
        status: "pending",
        interestRatePercent: interestRatePct,
        repaymentAmount: installmentAmount,
        totalRepayable,
        estimatedDecision: "Within 24 hours",
      },
    });
  } catch (e) {
    next(e);
  }
});

router.get("/loans", async (req, res, next) => {
  try {
    const q = currencyQuery.safeParse(req.query.currency);
    const currency = q.success ? q.data : undefined;
    const loans = await prisma.loan.findMany({
      where: {
        userId: req.user!.id,
        ...(currency ? { currency } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: loans });
  } catch (e) {
    next(e);
  }
});

const applyInstantSchema = z.object({
  amount: loanPrincipalSchema,
  creditType: z.enum(["essential", "emergency", "business"]),
  withCollateral: z.boolean().optional().default(false),
  currency: z.enum(["USD", "ZIG", "ZAR", "EUR", "GBP"]),
});

/**
 * POST /credit/apply-instant
 * Apply for credit with instant approval (auto-disburse).
 * Validates: no active loan, savings 20% for non-emergency.
 */
router.post("/apply-instant", async (req, res, next) => {
  try {
    const parsed = applyInstantSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validationError("Validation failed", { fields: zodErrorToFieldErrors(parsed.error) });
    }
    const { amount, creditType, currency } = parsed.data;

    const limitResult = await creditService.calculateCreditLimit(req.user!.id, { currency });
    if (amount > Number(limitResult.availableCredit)) {
      throw validationError("Amount exceeds available credit", {
        fields: [{ field: "amount", error: "Amount exceeds available credit" }],
      });
    }

    const wallet = await prisma.wallet.findFirst({
      where: { userId: req.user!.id, currencyCode: currency, isActive: true },
    });
    if (!wallet) throw validationError("Wallet not found");

    await assertWalletHasNoActiveLoan(prisma, wallet.id);

    const savingsBalance = Number(wallet.savingsBalance);
    if (creditType !== "emergency" && savingsBalance < amount * 0.2) {
      throw validationError("Savings must be at least 20% of loan amount for this credit type");
    }

    const serviceFee = amount * 0.015;
    const interest = amount * 0.18;
    const totalRepayable = amount + serviceFee + interest;
    const term = creditType === "essential" ? 12 : creditType === "emergency" ? 6 : 24;
    const interestRatePct = 18;

    const result = await processLoanDisbursement(req.user!.id, {
      principal: amount,
      totalRepayable,
      interestRate: interestRatePct,
      currency,
      term,
      creditType,
    });

    res.status(201).json({
      success: true,
      data: {
        applicationId: result.loanId,
        status: "approved",
        approvedAmount: amount,
        totalCredit: totalRepayable,
        approvedCreditBalance: result.approvedCreditBalance,
        activeLoanBalance: result.activeLoanBalance,
        transaction: result.transaction,
        repaymentCycle: `${term} months`,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
