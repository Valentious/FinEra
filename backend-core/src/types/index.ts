/**
 * FinEra Backend - Shared Types
 */

import type { AccountType, UserStatus, TransactionType, TransactionStatus, LoanStatus } from "@prisma/client";

export type { AccountType, UserStatus, TransactionType, TransactionStatus, LoanStatus };

export interface JwtPayload {
  sub: string;
  email: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "USER_NOT_FOUND"
  | "INVALID_PASSWORD"
  | "ACCOUNT_LOCKED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMIT"
  | "INTERNAL_ERROR";
