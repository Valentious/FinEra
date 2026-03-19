/**
 * FinEra Backend - Structured Logging
 * Sensitive data masking, request ID tracking
 */

import pino from "pino";

const SENSITIVE_KEYS = ["password", "passwordHash", "token", "refreshToken", "authorization", "cookie"];

function maskSensitive(obj: Record<string, unknown>): Record<string, unknown> {
  const masked = { ...obj };
  for (const key of Object.keys(masked)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lower.includes(s))) {
      masked[key] = "[REDACTED]";
    } else if (typeof masked[key] === "object" && masked[key] !== null && !Array.isArray(masked[key])) {
      masked[key] = maskSensitive(masked[key] as Record<string, unknown>);
    }
  }
  return masked;
}

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.passwordHash"],
    censor: "[REDACTED]",
  },
});

export function logWithRequestId(requestId: string, msg: string, obj?: Record<string, unknown>) {
  const safe = obj ? maskSensitive(obj) : {};
  logger.info({ requestId, ...safe }, msg);
}
