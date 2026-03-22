/**
 * FinEra Shared Utilities
 * Used across all backend services - no service-specific logic
 */

import crypto from 'node:crypto';

export function generateTransactionHash(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateReference(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
