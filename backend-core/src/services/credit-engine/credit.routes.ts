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
import { getTrustTierInfo, processingFeeForLoan, trustBelowLoanFloor } from "./domain/dynamic-credit-engine.js";
import { loanPrincipalSchema } from "../../shared/validation/zod-schemas.js";
import { zodErrorToFieldErrors } from "../../shared/validation/zod-format.js";
import type { AccountType, LoanProductType } from "@prisma/client";
import { assertDocumentsAllowLoanApplication } from "../member-documents/member-documents.service.js";

const router = Router();

router.use(authMiddleware);

const loanProductEnum = z.enum(["ASSET_BACKED", "SALARY_BACKED", "COLLATERAL", "NON_COLLATERAL"]);

function requiresWalletDisciplineForAmount(loanType: LoanProductType, creditType: string): boolean {
  return loanType === "NON_COLLATERAL" && (creditType === "essential" || creditType === "business");
}

function loanTypeAllowedForAccount(loanType: LoanProductType, accountType: AccountType): boolean {
  if (accountType === "STUDENT") return loanType === "NON_COLLATERAL";
  if (accountType === "ALUMNI") return loanType === "ASSET_BACKED";
  return loanType === "ASSET_BACKED" || loanType === "SALARY_BACKED";
}

const applySchema = z.object({
  amount: loanPrincipalSchema,
  currency: z.enum(["USD", "ZIG", "ZAR", "EUR", "GBP"]),
  term: z.number().int().min(1).max(60).optional(),
  creditType: z.enum(["essential", "business"]).optional(),
  loanType: loanProductEnum.optional().default("NON_COLLATERAL"),
});

router.get("/score", async (req, res, next) => {
  try {
    const { score, factors } = await creditService.calculateCreditScore(req.user!.id);
    const tier = getTrustTierInfo(score);
    res.json({
      success: true,
      data: {
        score,
        factors,
        trustTier: tier.tierKey,
        riskStatus: tier.apiRiskStatus,
        lastUpdated: new Date(),
      },
    });
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
    const tier = getTrustTierInfo(result.financialDisciplineScore);
    res.json({
      success: true,
      data: {
        creditLimit: result.creditLimit,
        availableCredit: result.availableCredit,
        financialDisciplineScore: result.financialDisciplineScore,
        trustTier: tier.tierKey,
        riskStatus: tier.apiRiskStatus,
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
    if (trustBelowLoanFloor(limitResult.financialDisciplineScore)) {
      throw validationError("Trust score is below the minimum required to borrow", {
        fields: [{ field: "trustScore", error: "Trust score must be at least 20 to request a loan" }],
      });
    }
    if (amount > available) {
      throw validationError("Amount exceeds available credit", {
        fields: [{ field: "amount", error: "Amount exceeds available credit" }],
      });
    }

    const interestRatePct = assignLoanInterestRatePercent(amount);
    const processingFee = processingFeeForLoan();

    const wallet = await prisma.wallet.findFirst({
      where: { userId: req.user!.id, currencyCode: currency },
      select: { id: true },
    });
    if (!wallet) throw validationError("Wallet not found");

    await assertWalletHasNoActiveLoan(prisma, wallet.id);
    await assertDocumentsAllowLoanApplication(req.user!.id, loanType);

    const rateDecimal = interestRatePct / 100;
    const totalInterest = amount * rateDecimal * (term / 12);
    const fees = processingFee;
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

    const tier = getTrustTierInfo(limitResult.financialDisciplineScore);
    res.status(202).json({
      success: true,
      data: {
        applicationId: application.id,
        loanNumber: application.loanNumber,
        status: "pending",
        approvedLoanAmount: amount,
        interestRateAppliedPercent: interestRatePct,
        processingFee: fees,
        totalRepaymentAmount: totalRepayable,
        updatedTrustScore: limitResult.financialDisciplineScore,
        updatedCreditLimit: limitResult.creditLimit,
        riskStatus: tier.apiRiskStatus,
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
  creditType: z.enum(["essential", "business"]),
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
    if (trustBelowLoanFloor(limitResult.financialDisciplineScore)) {
      throw validationError("Trust score is below the minimum required to borrow", {
        fields: [{ field: "trustScore", error: "Trust score must be at least 20 to request a loan" }],
      });
    }
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

    const interestRatePct = assignLoanInterestRatePercent(amount);
    const processingFee = processingFeeForLoan();
    const term = creditType === "essential" ? 12 : 24;
    const interest = amount * (interestRatePct / 100) * (term / 12);
    const totalRepayable = amount + processingFee + interest;

    const result = await processLoanDisbursement(req.user!.id, {
      principal: amount,
      totalRepayable,
      interestRate: interestRatePct,
      currency,
      term,
      creditType,
      loanType: loanProduct,
      fees: processingFee,
    });

    const refreshed = await creditService.calculateCreditLimit(req.user!.id, { currency });
    const tier = getTrustTierInfo(refreshed.financialDisciplineScore);

    res.status(201).json({
      success: true,
      data: {
        applicationId: result.loanId,
        status: "approved",
        approvedLoanAmount: amount,
        interestRateAppliedPercent: interestRatePct,
        totalRepaymentAmount: totalRepayable,
        updatedTrustScore: refreshed.financialDisciplineScore,
        updatedCreditLimit: refreshed.creditLimit,
        riskStatus: tier.apiRiskStatus,
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
