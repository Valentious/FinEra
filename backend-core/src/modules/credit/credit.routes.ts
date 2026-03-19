/**
 * FinEra Backend - Credit Routes
 */

import { Router } from "express";
import { prisma } from "../../infrastructure/database/index.js";
import { authMiddleware } from "../../middlewares/auth.js";
import * as creditService from "./credit.service.js";
import { z } from "zod";
import { validationError } from "../../middlewares/errorHandler.js";

const router = Router();

router.use(authMiddleware);

const applySchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["USD", "ZIG", "ZAR", "EUR"]),
  term: z.number().int().min(1).max(60),
});

router.get("/score", async (req, res, next) => {
  try {
    const { score, factors } = await creditService.calculateCreditScore(req.user!.id);
    res.json({ success: true, data: { score, factors, lastUpdated: new Date() } });
  } catch (e) {
    next(e);
  }
});

router.get("/limit", async (req, res, next) => {
  try {
    const result = await creditService.calculateCreditLimit(req.user!.id);
    res.json({
      success: true,
      data: {
        creditLimit: result.creditLimit,
        availableCredit: result.availableCredit,
        financialDisciplineScore: result.financialDisciplineScore,
        currency: "USD",
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post("/apply", async (req, res, next) => {
  try {
    const parsed = applySchema.safeParse(req.body);
    if (!parsed.success) throw validationError("Validation failed");
    const { amount, currency, term } = parsed.data;

    const limitResult = await creditService.calculateCreditLimit(req.user!.id);
    if (amount > limitResult.availableCredit) {
      throw validationError("Amount exceeds available credit");
    }

    const activeLoansCount = await prisma.loan.count({
      where: { userId: req.user!.id, status: "ACTIVE" },
    });
    const interestRatePct = creditService.getInterestRate(
      currency,
      limitResult.financialDisciplineScore,
      amount,
      term,
      activeLoansCount,
      false
    );

    const wallet = await prisma.wallet.findFirst({
      where: { userId: req.user!.id, currencyCode: currency },
    });
    if (!wallet) throw validationError("Wallet not found");

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
        status: "PENDING",
        estimatedDecision: "Within 24 hours",
      },
    });
  } catch (e) {
    next(e);
  }
});

router.get("/loans", async (req, res, next) => {
  try {
    const loans = await prisma.loan.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: loans });
  } catch (e) {
    next(e);
  }
});

export default router;
