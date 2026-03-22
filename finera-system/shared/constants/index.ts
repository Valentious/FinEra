/**
 * FinEra Shared Constants
 * Role-based access control and system-wide constants
 */

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum EventType {
  USER_REGISTERED = 'USER_REGISTERED',
  TRANSACTION_COMPLETED = 'TRANSACTION_COMPLETED',
  CREDIT_SCORE_UPDATED = 'CREDIT_SCORE_UPDATED',
}

export const CURRENCY_CODES = ['USD', 'ZIG', 'ZAR', 'EUR', 'GBP'] as const;
