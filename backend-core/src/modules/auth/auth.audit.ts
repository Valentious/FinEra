/**
 * FinEra - Auth Audit Logging
 * Log all login attempts (success/failure) for audit trail.
 * Non-blocking - does not affect auth flow.
 */

import { prisma } from "../../infrastructure/database/index.js";
import { logger } from "../../core/utils/logger.js";

export type LoginAttemptOutcome = "SUCCESS" | "USER_NOT_FOUND" | "INVALID_PASSWORD" | "ACCOUNT_INACTIVE";

export function logLoginAttempt(params: {
  email: string;
  outcome: LoginAttemptOutcome;
  userId?: string;
  ip?: string;
  userAgent?: string;
}): void {
  logger.info(
    {
      event: "login_attempt",
      email: params.email,
      outcome: params.outcome,
      userId: params.userId,
      ip: params.ip,
    },
    `Login ${params.outcome}: ${params.email}`
  );

  prisma.auditLog
    .create({
      data: {
        userId: params.userId ?? undefined,
        action: "LOGIN_ATTEMPT",
        entityType: "User",
        entityId: params.userId ?? params.email,
        newValues: {
          email: params.email,
          outcome: params.outcome,
        } as object,
        ipAddress: params.ip ?? undefined,
        userAgent: params.userAgent ?? undefined,
        timestamp: new Date(),
      },
    })
    .catch((err) => logger.warn({ err }, "Audit log write failed (non-blocking)"));
}
