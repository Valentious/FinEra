/**
 * FinEra Backend - Transaction Service
 * Delegates deposit/withdrawal to Transaction Engine (strict currency isolation).
 * Loan flows remain for credit/repayment.
 */

import { prisma } from "../../infrastructure/database/index.js";
import type { CurrencyCode, TransactionType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import {
  validateSufficientBalance,
  calculateAvailableForWithdrawal,
  generateReference,
  type DepositInput,
  type WithdrawInput,
} from "./wallet.service.js";
import {
  processDeposit as engineDeposit,
  processWithdrawal as engineWithdraw,
  processTransfer as engineTransfer,
} from "./transaction-engine.service.js";
import { validationError } from "../../middlewares/errorHandler.js";

/**
 * Deposit: Uses engine. ONLY affects specified currency wallet + ledger.
 */
export async function processDeposit(
  userId: string,
  input: DepositInput
): Promise<{
  transactionId: string;
  reference: string;
  newBalance: number;
  transaction: { id: string; type: string; amount: number; date: string; description: string };
}> {
  const paymentMethod = input.paymentMethod ?? input.method ?? "manual";
  const { amount, currency, purpose, metadata } = input;

  const result = await engineDeposit({
    userId,
    currency,
    amount,
    fee: 0,
    reference: input.referenceId,
    metadata: {
      paymentMethod: String(paymentMethod),
      purpose: purpose ?? undefined,
      ...(metadata ?? {}),
    },
  });

  return {
    transactionId: result.transactionId,
    reference: result.reference,
    newBalance: result.newBalance,
    transaction: {
      id: result.transactionId,
      type: "deposit",
      amount,
      date: new Date().toISOString(),
      description: `Deposit via ${paymentMethod}${purpose ? ` - ${purpose}` : ""}`,
    },
  };
}

/**
 * Withdrawal: Uses engine. ONLY affects specified currency wallet + ledger.
 */
export async function processWithdrawal(
  userId: string,
  input: WithdrawInput
): Promise<{
  transactionId: string;
  reference: string;
  newBalance: number;
  transaction: { id: string; type: string; amount: number; date: string; description: string };
}> {
  const withdrawalMethod = input.withdrawalMethod ?? input.method ?? "manual";
  const { amount, currency, accountDetails } = input;

  const wallet = await prisma.wallet.findFirst({
    where: { userId, currencyCode: currency, isActive: true },
  });
  if (!wallet) throw validationError(`Wallet not found for currency ${currency}`);

  const available = calculateAvailableForWithdrawal(wallet.savingsBalance, wallet.activeLoanBalance);
  validateSufficientBalance(available, amount);

  const result = await engineWithdraw({
    userId,
    currency,
    amount,
    fee: 0,
    reference: input.referenceId,
    metadata: {
      withdrawalMethod: String(withdrawalMethod),
      accountDetails: accountDetails ?? {},
    },
  });

  return {
    transactionId: result.transactionId,
    reference: result.reference,
    newBalance: result.newBalance,
    transaction: {
      id: result.transactionId,
      type: "withdrawal",
      amount,
      date: new Date().toISOString(),
      description: `Withdrawal via ${withdrawalMethod}`,
    },
  };
}

/**
 * Transfer between users - same currency only. Uses engine.
 */
export async function processTransfer(
  fromUserId: string,
  toUserId: string,
  params: { amount: number; currency: CurrencyCode; referenceId?: string }
): Promise<{ transactionId: string; reference: string; fromNewBalance: number; toNewBalance: number }> {
  return engineTransfer({
    fromUserId,
    toUserId,
    currency: params.currency,
    amount: params.amount,
    fee: 0,
    reference: params.referenceId,
  });
}

/** Commission on moving funds from Approved Credit → FinCash wallet (same currency). */
const APPROVED_CREDIT_TO_WALLET_FEE_RATE = new Decimal("0.015");

/**
 * Transfer from approved credit to user's FinCash wallet (same currency). Atomic.
 * Charges 1.5% commission on the gross amount moved from approved credit; net is credited to the wallet.
 */
export async function processTransferCreditToWallet(
  userId: string,
  amount: number,
  currency: import("@prisma/client").CurrencyCode = "USD"
): Promise<{
  approvedCreditWallet: number;
  balance: number;
  fee: number;
  netCredited: number;
  transaction: { id: string; type: string; amount: number; date: string; description: string };
}> {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findFirst({
      where: { userId, currencyCode: currency, isActive: true },
    });
    if (!wallet) {
      throw validationError(`Wallet not found for currency ${currency}`);
    }
    const approved = Number(wallet.approvedCreditBalance);
    if (amount > approved) {
      throw validationError(
        `Insufficient approved credit. Available: ${approved.toFixed(2)}, requested: ${amount.toFixed(2)}`
      );
    }

    const gross = new Decimal(amount);
    const fee = gross.mul(APPROVED_CREDIT_TO_WALLET_FEE_RATE).toDecimalPlaces(8, Decimal.ROUND_HALF_UP);
    const netToWallet = gross.sub(fee);

    const reference = generateReference();

    const [txn] = await Promise.all([
      tx.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          reference,
          transactionType: "TRANSFER",
          amount: gross,
          fee,
          netAmount: netToWallet,
          currency,
          status: "COMPLETED",
          completedAt: new Date(),
          metadata: {
            type: "credit_to_wallet",
            commissionRate: 0.015,
            grossFromApprovedCredit: Number(gross),
          } as object,
        },
      }),
      tx.wallet.update({
        where: { id: wallet.id },
        data: {
          approvedCreditBalance: { decrement: gross },
          savingsBalance: { increment: netToWallet },
          balance: { increment: netToWallet },
          availableBalance: { increment: netToWallet },
          lastTransactionAt: new Date(),
        },
      }),
    ]);

    const updated = await tx.wallet.findUnique({
      where: { id: wallet.id },
      select: { balance: true, approvedCreditBalance: true },
    });

    const feeNum = Number(fee);
    const netNum = Number(netToWallet);

    return {
      approvedCreditWallet: Number(updated?.approvedCreditBalance ?? 0),
      balance: Number(updated?.balance ?? 0),
      fee: feeNum,
      netCredited: netNum,
      transaction: {
        id: txn.id,
        type: "deposit",
        amount: netNum,
        date: txn.completedAt?.toISOString() ?? new Date().toISOString(),
        description: `Transfer from Approved Credit to FinCash wallet (1.5% commission ${feeNum.toFixed(2)} ${currency})`,
      },
    };
  });
}

/** @deprecated Use processTransferCreditToWallet */
export const processTransferCreditToSavings = processTransferCreditToWallet;

/**
 * Loan disbursement - atomic: create loan record, update wallet, create transaction.
 */
export async function processLoanDisbursement(
  userId: string,
  params: {
    principal: number;
    totalRepayable: number;
    interestRate: number;
    currency: CurrencyCode;
    term: number;
    creditType?: string;
  }
): Promise<{
  loanId: string;
  approvedCreditBalance: number;
  activeLoanBalance: number;
  transaction: { id: string; type: string; amount: number; date: string; description: string };
}> {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findFirst({
      where: { userId, currencyCode: params.currency, isActive: true },
    });
    if (!wallet) {
      throw validationError(`Wallet not found for currency ${params.currency}`);
    }

    const loanNumber = `LN-${new Date().toISOString().slice(0, 7).replace(/-/, "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const reference = generateReference();

    const loan = await tx.loan.create({
      data: {
        loanNumber,
        userId,
        walletId: wallet.id,
        principalAmount: params.principal,
        interestRate: params.interestRate,
        totalInterest: params.totalRepayable - params.principal,
        totalRepayable: params.totalRepayable,
        remainingBalance: params.totalRepayable,
        amountDisbursed: params.principal,
        currency: params.currency,
        term: params.term,
        installmentAmount: params.totalRepayable / params.term,
        maturityDate: new Date(Date.now() + params.term * 30 * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
        disbursementDate: new Date(),
      },
    });

    const [txn] = await Promise.all([
      tx.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          reference,
          transactionType: "LOAN_DISBURSEMENT",
          amount: new Decimal(params.principal),
          fee: new Decimal(0),
          netAmount: new Decimal(params.principal),
          currency: params.currency,
          status: "COMPLETED",
          completedAt: new Date(),
          metadata: { loanId: loan.id, creditType: params.creditType } as object,
        },
      }),
      tx.wallet.update({
        where: { id: wallet.id },
        data: {
          approvedCreditBalance: { increment: params.principal },
          activeLoanBalance: { increment: params.totalRepayable },
          totalLoanAmount: { increment: params.totalRepayable },
          lastTransactionAt: new Date(),
        },
      }),
    ]);

    const updated = await tx.wallet.findUnique({
      where: { id: wallet.id },
      select: { approvedCreditBalance: true, activeLoanBalance: true },
    });

    return {
      loanId: loan.id,
      approvedCreditBalance: Number(updated?.approvedCreditBalance ?? 0),
      activeLoanBalance: Number(updated?.activeLoanBalance ?? 0),
      transaction: {
        id: txn.id,
        type: "loan",
        amount: params.principal,
        date: txn.completedAt?.toISOString() ?? new Date().toISOString(),
        description: `${params.creditType ?? "Loan"} approved - disbursed`,
      },
    };
  });
}

/**
 * Loan repayment - atomic: create transaction, update wallet and loan.
 */
export async function processLoanRepayment(
  userId: string,
  params: {
    amount: number;
    method: string;
    currency: CurrencyCode;
    /** When true, repayment is settled from the user's FinCash wallet for this currency */
    deductFromWallet?: boolean;
  }
): Promise<{
  transactionId: string;
  remainingBalance: number;
  newBalance: number;
  loanFullyPaid: boolean;
}> {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findFirst({
      where: { userId, currencyCode: params.currency, isActive: true },
    });
    if (!wallet) {
      throw validationError(`Wallet not found for currency ${params.currency}`);
    }

    const activeLoan = Number(wallet.activeLoanBalance);
    if (activeLoan <= 0) {
      throw validationError("No active loan to repay");
    }
    if (params.amount <= 0 || params.amount > activeLoan) {
      throw validationError(`Invalid repayment amount. Outstanding: ${activeLoan.toFixed(2)}`);
    }

    const deductFromWallet = params.deductFromWallet === true;
    if (deductFromWallet) {
      const avail = Number(wallet.savingsBalance);
      if (params.amount > avail) {
        throw validationError(`Insufficient wallet balance. Available: ${avail.toFixed(2)}`);
      }
    }

    const reference = generateReference();
    const repaymentAmount = Math.min(params.amount, activeLoan);
    const newActiveLoan = activeLoan - repaymentAmount;
    const loanFullyPaid = newActiveLoan <= 0;

    const walletUpdate = deductFromWallet
      ? {
          activeLoanBalance: { decrement: repaymentAmount },
          totalRepaidAmount: { increment: repaymentAmount },
          savingsBalance: { decrement: repaymentAmount },
          balance: { decrement: repaymentAmount },
          availableBalance: { decrement: repaymentAmount },
          lastTransactionAt: new Date(),
        }
      : {
          activeLoanBalance: { decrement: repaymentAmount },
          totalRepaidAmount: { increment: repaymentAmount },
          lastTransactionAt: new Date(),
        };

    const [txn] = await Promise.all([
      tx.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          reference,
          transactionType: "LOAN_REPAYMENT",
          amount: new Decimal(repaymentAmount),
          fee: new Decimal(0),
          netAmount: new Decimal(repaymentAmount),
          currency: params.currency,
          status: "COMPLETED",
          completedAt: new Date(),
          metadata: { method: params.method } as object,
        },
      }),
      tx.wallet.update({
        where: { id: wallet.id },
        data: walletUpdate,
      }),
    ]);

    const updated = await tx.wallet.findUnique({
      where: { id: wallet.id },
      select: { activeLoanBalance: true, balance: true },
    });

    return {
      transactionId: txn.id,
      remainingBalance: newActiveLoan,
      newBalance: Number(updated?.balance ?? wallet.balance),
      loanFullyPaid,
    };
  });
}

/**
 * List transactions for user with pagination.
 * Currency REQUIRED - per-currency isolation. No cross-currency results.
 */
export async function listTransactions(
  userId: string,
  params: {
    page?: number;
    limit?: number;
    type?: TransactionType;
    status?: string;
    currency: CurrencyCode;
  }
) {
  if (!params.currency) {
    throw validationError("Currency context REQUIRED for transaction list. Include ?currency=USD");
  }
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(50, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { userId, currency: params.currency };
  if (params.type) (where as Record<string, unknown>).transactionType = params.type;
  if (params.status) (where as Record<string, unknown>).status = params.status;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
