/**
 * FinEra - FX Conversion Service
 *
 * EXPLICIT currency conversion - ALWAYS separate operations.
 * Never combines balances or updates multiple currencies in one operation.
 * Debit from source wallet, then credit to destination wallet (via engine).
 */

import type { CurrencyCode } from "@prisma/client";
import { validationError } from "../../middlewares/errorHandler.js";
import {
  processDeposit,
  processWithdrawal,
  generateReference,
} from "./transaction-engine.service.js";

export interface FXConvertParams {
  userId: string;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  amount: number;
  rate: number;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}

export interface FXConvertResult {
  debitTransactionId: string;
  creditTransactionId: string;
  fromCurrency: CurrencyCode;
  fromAmount: number;
  toCurrency: CurrencyCode;
  toAmount: number;
  rate: number;
}

/**
 * Explicit FX conversion: withdraw from source, deposit to target.
 * Two separate ACID operations - never combined.
 */
export async function convertCurrency(params: FXConvertParams): Promise<FXConvertResult> {
  if (params.fromCurrency === params.toCurrency) {
    throw validationError("Cannot convert same currency");
  }
  if (params.amount <= 0) {
    throw validationError("Amount must be positive");
  }
  if (params.rate <= 0) {
    throw validationError("Rate must be positive");
  }

  const baseRef = params.referenceId ?? generateReference();
  const debitRef = `${baseRef}_debit`;
  const creditRef = `${baseRef}_credit`;

  // STEP 1: Debit from source wallet (single-currency operation)
  const debitResult = await processWithdrawal({
    userId: params.userId,
    currency: params.fromCurrency,
    amount: params.amount,
    fee: 0,
    reference: debitRef,
    metadata: {
      ...(params.metadata ?? {}),
      fxConversion: true,
      toCurrency: params.toCurrency,
      rate: params.rate,
    },
  });

  // STEP 2: Credit to destination wallet (single-currency operation)
  const convertedAmount = params.amount * params.rate;
  const creditResult = await processDeposit({
    userId: params.userId,
    currency: params.toCurrency,
    amount: convertedAmount,
    fee: 0,
    reference: creditRef,
    metadata: {
      ...(params.metadata ?? {}),
      fxConversion: true,
      fromCurrency: params.fromCurrency,
      fromAmount: params.amount,
      rate: params.rate,
    },
  });

  return {
    debitTransactionId: debitResult.transactionId,
    creditTransactionId: creditResult.transactionId,
    fromCurrency: params.fromCurrency,
    fromAmount: params.amount,
    toCurrency: params.toCurrency,
    toAmount: convertedAmount,
    rate: params.rate,
  };
}
