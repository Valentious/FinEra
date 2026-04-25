/**
 * FinEra - Auth Audit Logging
 * Log all login attempts (success/failure) for audit trail.
 * Non-blocking - does not affect auth flow.
 */

import { prisma } from "../../infrastructure/database/index.js";
import { logger } from "../../core/utils/logger.js";

export type LoginAttemptOutcome =
  | "SUCCESS"
  | "USER_NOT_FOUND"
  | "INVALID_PASSWORD"
  | "ACCOUNT_INACTIVE"
  | "ACCOUNT_LOCKED"
  | "EMAIL_NOT_VERIFIED"
  | "PHONE_NOT_VERIFIED"
  | "PENDING_VERIFICATION"
  | "ACCOUNT_TYPE_MISMATCH";

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

export type RegistrationAttemptOutcome = "DUPLICATE_DIFFERENT_ACCOUNT_TYPE" | "DUPLICATE_SAME_ACCOUNT_TYPE";

/** Registration blocked: email already bound to an account type. Logs structured fields; public message comes from auth-messages. */
export function logRegistrationAttempt(params: {
  email: string;
  outcome: RegistrationAttemptOutcome;
  requestedAccountType?: string;
  existingAccountType?: string;
  ip?: string;
  userAgent?: string;
}): void {
  logger.warn(
    {
      event: "registration_attempt",
      email: params.email,
      outcome: params.outcome,
      requestedAccountType: params.requestedAccountType,
      existingAccountType: params.existingAccountType,
      ip: params.ip,
    },
    `Registration ${params.outcome}: ${params.email}`
  );

  prisma.auditLog
    .create({
      data: {
        action: "REGISTRATION_ATTEMPT",
        entityType: "User",
        entityId: params.email,
        newValues: {
          email: params.email,
          outcome: params.outcome,
          requestedAccountType: params.requestedAccountType,
          existingAccountType: params.existingAccountType,
        } as object,
        ipAddress: params.ip ?? undefined,
        userAgent: params.userAgent ?? undefined,
        timestamp: new Date(),
      },
    })
    .catch((err) => logger.warn({ err }, "Audit log write failed (non-blocking)"));
}
