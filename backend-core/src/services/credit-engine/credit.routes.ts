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
import type { AccountType, LoanProductType } from "@prisma/client";
import { assertDocumentsAllowLoanApplication } from "../member-documents/member-documents.service.js";

const router = Router();

router.use(authMiddleware);

const loanProductEnum = z.enum(["ASSET_BACKED", "SALARY_BACKED", "COLLATERAL", "NON_COLLATERAL"]);

function requiresWalletDisciplineForAmount(loanType: LoanProductType, creditType: string): boolean {
  if (creditType === "emergency") return false;
  return loanType === "NON_COLLATERAL" && (creditType === "essential" || creditType === "business");
}

function loanTypeAllowedForAccount(loanType: LoanProductType, accountType: AccountType): boolean {
  if (accountType === "STUDENT") return loanType === "COLLATERAL" || loanType === "NON_COLLATERAL";
  return loanType === "ASSET_BACKED" || loanType === "SALARY_BACKED";
}

const applySchema = z.object({
  amount: loanPrincipalSchema,
  currency: z.enum(["USD", "ZIG", "ZAR", "EUR", "GBP"]),
  term: z.number().int().min(1).max(60).optional(),
  creditType: z.enum(["essential", "emergency", "business"]).optional(),
  loanType: loanProductEnum.optional().default("NON_COLLATERAL"),
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
    const loanType = parsed.data.loanType as LoanProductType;

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
    await assertDocumentsAllowLoanApplication(req.user!.id, loanType);

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
        loanType,
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
  loanType: loanProductEnum,
  currency: z.enum(["USD", "ZIG", "ZAR", "EUR", "GBP"]),
});

/**
 * POST /credit/apply-instant
 * Apply for credit with instant approval (auto-disburse).
 * Validates: account vs loan product, no active loan, wallet 20% only for unsecured student flows.
 */
router.post("/apply-instant", async (req, res, next) => {
  try {
    const parsed = applyInstantSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validationError("Validation failed", { fields: zodErrorToFieldErrors(parsed.error) });
    }
    const { amount, creditType, currency, loanType } = parsed.data;
    const loanProduct = loanType as LoanProductType;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { accountType: true },
    });
    if (!user) throw validationError("User not found");
    if (!loanTypeAllowedForAccount(loanProduct, user.accountType)) {
      throw validationError("This loan type is not available for your account", {
        fields: [{ field: "loanType", error: "Loan type not allowed for account" }],
      });
    }

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

    const walletBal = Number(wallet.balance);
    if (requiresWalletDisciplineForAmount(loanProduct, creditType) && walletBal < amount * 0.2) {
      throw validationError("Wallet balance must be at least 20% of loan amount for this product", {
        fields: [{ field: "amount", error: "Insufficient wallet balance for unsecured student loan" }],
      });
    }

    await assertDocumentsAllowLoanApplication(req.user!.id, loanProduct);

    const serviceFee = amount * 0.015;
    let interestRatePct = 18;
    if (loanProduct === "SALARY_BACKED") interestRatePct = 17;
    else if (loanProduct === "ASSET_BACKED" || loanProduct === "COLLATERAL") interestRatePct = 16;
    else if (loanProduct === "NON_COLLATERAL") interestRatePct = 18.5;
    const interest = amount * (interestRatePct / 100);
    const totalRepayable = amount + serviceFee + interest;
    const term = creditType === "essential" ? 12 : creditType === "emergency" ? 6 : 24;

    const result = await processLoanDisbursement(req.user!.id, {
      principal: amount,
      totalRepayable,
      interestRate: interestRatePct,
      currency,
      term,
      creditType,
      loanType: loanProduct,
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
