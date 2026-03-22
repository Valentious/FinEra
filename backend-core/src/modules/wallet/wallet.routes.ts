/**
 * FinEra Backend - Wallet Routes
 * GET balance, POST deposit, POST withdrawal, GET transactions, GET portfolio
 * All request/response validated with Zod.
 */

import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.js";
import { fraudDetectionMiddleware } from "../../application/middlewares/fraud-detection.middleware.js";
import {
  validateDepositInput,
  validateWithdrawInput,
  getWalletOrThrow,
  calculateAvailableForWithdrawal,
} from "./wallet.service.js";
import {
  processDeposit,
  processWithdrawal,
  processTransfer,
  processTransferCreditToSavings,
  processLoanRepayment,
  listTransactions,
} from "./transaction.service.js";
import { convertCurrency } from "./fx.service.js";
import { freezeWallet, unfreezeWallet } from "./wallet.service.js";
import { verifyLedgerConsistency, verifyAllLedgers, initializeAllLedgers } from "./ledger.service.js";
import { getPortfolioSummary } from "./portfolio.service.js";
import { validationError } from "../../middlewares/errorHandler.js";

const router = Router();
router.use(authMiddleware);

const CURRENCIES = ["USD", "ZIG", "ZAR", "EUR", "GBP", "USDT"] as const;
const currencyQuerySchema = z.object({
  currency: z.enum(CURRENCIES),
});

const transactionsQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
  type: z.enum(["DEPOSIT", "WITHDRAWAL", "PAYMENT", "LOAN_DISBURSEMENT", "LOAN_REPAYMENT", "FEE", "INTEREST", "TRANSFER", "FX_CONVERSION"]).optional(),
  status: z.string().optional(),
  currency: z.enum(CURRENCIES),
});

/**
 * GET /wallet/balance
 * Get wallet balance for currency.
 */
router.get("/balance", async (req, res, next) => {
  try {
    const parsed = currencyQuerySchema.safeParse(req.query);
    if (!parsed.success) throw validationError("Invalid query", { zod: parsed.error.flatten() });
    const { currency } = parsed.data;

    const wallet = await getWalletOrThrow(req.user!.id, currency);
    const available = calculateAvailableForWithdrawal(
      wallet.savingsBalance,
      wallet.activeLoanBalance
    );

    res.json({
      success: true,
      data: {
        currencyCode: wallet.currencyCode,
        accountNumber: wallet.accountNumber,
        balance: Number(wallet.balance),
        savingsBalance: Number(wallet.savingsBalance),
        availableBalance: Number(wallet.availableBalance),
        availableForWithdrawal: available,
        activeLoanBalance: Number(wallet.activeLoanBalance),
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /wallet/deposit
 * Deposit funds. Atomic update via transaction.service.
 */
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

/**
 * POST /wallet/withdraw
 * Withdraw funds. Atomic update via transaction.service.
 */
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

/**
 * GET /wallet/transactions
 * List transactions with pagination.
 */
router.get("/transactions", async (req, res, next) => {
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

const transferSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.enum(CURRENCIES),
});

const userToUserTransferSchema = z.object({
  toUserId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  currency: z.enum(CURRENCIES),
  referenceId: z.string().max(100).optional(),
});

const fxConvertSchema = z.object({
  fromCurrency: z.enum(CURRENCIES),
  toCurrency: z.enum(CURRENCIES),
  amount: z.coerce.number().positive(),
  rate: z.coerce.number().positive(),
  referenceId: z.string().max(100).optional(),
});

const repaySchema = z.object({
  amount: z.number().positive(),
  method: z.string().min(1),
  currency: z.enum(CURRENCIES),
  deductFromSavings: z.boolean().optional().default(false),
});

/**
 * POST /wallet/transfer
 * Transfer to another user - same currency only.
 */
router.post("/transfer", fraudDetectionMiddleware, async (req, res, next) => {
  try {
    const parsed = userToUserTransferSchema.safeParse(req.body);
    if (!parsed.success) throw validationError("Invalid request", { zod: parsed.error.flatten() });
    const { toUserId, amount, currency, referenceId } = parsed.data;

    const result = await processTransfer(req.user!.id, toUserId, {
      amount,
      currency,
      referenceId,
    });

    res.status(201).json({
      success: true,
      data: {
        transactionId: result.transactionId,
        reference: result.reference,
        fromNewBalance: result.fromNewBalance,
        toNewBalance: result.toNewBalance,
        currency,
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /wallet/convert
 * Explicit FX conversion - separate debit + credit operations.
 */
router.post("/convert", fraudDetectionMiddleware, async (req, res, next) => {
  try {
    const parsed = fxConvertSchema.safeParse(req.body);
    if (!parsed.success) throw validationError("Invalid request", { zod: parsed.error.flatten() });
    const { fromCurrency, toCurrency, amount, rate, referenceId } = parsed.data;

    const result = await convertCurrency({
      userId: req.user!.id,
      fromCurrency,
      toCurrency,
      amount,
      rate,
      referenceId,
    });

    res.status(201).json({
      success: true,
      data: {
        debitTransactionId: result.debitTransactionId,
        creditTransactionId: result.creditTransactionId,
        fromCurrency: result.fromCurrency,
        fromAmount: result.fromAmount,
        toCurrency: result.toCurrency,
        toAmount: result.toAmount,
        rate: result.rate,
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /wallet/transfer-credit-to-savings
 * Transfer from approved credit wallet to savings.
 */
router.post("/transfer-credit-to-savings", async (req, res, next) => {
  try {
    const parsed = transferSchema.safeParse(req.body);
    if (!parsed.success) throw validationError("Invalid request", { zod: parsed.error.flatten() });
    const { amount, currency } = parsed.data;

    const result = await processTransferCreditToSavings(req.user!.id, amount, currency);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /wallet/repay
 * Make loan repayment. Atomic update via transaction.service.
 */
router.post("/repay", fraudDetectionMiddleware, async (req, res, next) => {
  try {
    const parsed = repaySchema.safeParse(req.body);
    if (!parsed.success) throw validationError("Invalid request", { zod: parsed.error.flatten() });
    const { amount, method, currency, deductFromSavings } = parsed.data;

    const result = await processLoanRepayment(req.user!.id, {
      amount,
      method,
      currency,
      deductFromSavings,
    });

    res.status(201).json({
      success: true,
      data: {
        transactionId: result.transactionId,
        remainingBalance: result.remainingBalance,
        newSavingsBalance: result.newSavingsBalance,
        loanFullyPaid: result.loanFullyPaid,
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /wallet/ledger-consistency
 * Verify wallet balances match ledger (ops/admin). Optional ?currency= filter.
 */
router.get("/ledger-consistency", async (req, res, next) => {
  try {
    const parsed = currencyQuerySchema.safeParse(req.query);
    if (!parsed.success) throw validationError("Invalid query", { zod: parsed.error.flatten() });
    const { currency } = parsed.data;

    const result = await verifyLedgerConsistency(currency);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /wallet/ledger-consistency/all
 * Verify all currencies.
 */
router.get("/ledger-consistency/all", async (_req, res, next) => {
  try {
    const results = await verifyAllLedgers();
    res.json({ success: true, data: results });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /wallet/init-ledgers
 * Initialize ledgers for all supported currencies (idempotent).
 */
router.post("/init-ledgers", async (_req, res, next) => {
  try {
    await initializeAllLedgers();
    res.json({ success: true, message: "Ledgers initialized" });
  } catch (e) {
    next(e);
  }
});

const freezeSchema = z.object({
  currency: z.enum(CURRENCIES),
});

/**
 * POST /wallet/freeze
 * Freeze a specific currency wallet.
 */
router.post("/freeze", async (req, res, next) => {
  try {
    const parsed = freezeSchema.safeParse(req.body);
    if (!parsed.success) throw validationError("Invalid request", { zod: parsed.error.flatten() });
    const { currency } = parsed.data;

    const wallet = await freezeWallet(req.user!.id, currency);
    res.json({ success: true, data: { walletId: wallet.id, status: wallet.status } });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /wallet/unfreeze
 * Unfreeze a specific currency wallet.
 */
router.post("/unfreeze", async (req, res, next) => {
  try {
    const parsed = freezeSchema.safeParse(req.body);
    if (!parsed.success) throw validationError("Invalid request", { zod: parsed.error.flatten() });
    const { currency } = parsed.data;

    const wallet = await unfreezeWallet(req.user!.id, currency);
    res.json({ success: true, data: { walletId: wallet.id, status: wallet.status } });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /wallet/portfolio
 * Get portfolio summary from transaction history.
 */
router.get("/portfolio", async (req, res, next) => {
  try {
    const parsed = currencyQuerySchema.safeParse(req.query);
    if (!parsed.success) throw validationError("Invalid query", { zod: parsed.error.flatten() });
    const { currency } = parsed.data;

    const summary = await getPortfolioSummary(req.user!.id, currency);

    res.json({
      success: true,
      data: summary,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
