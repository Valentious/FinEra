/**
 * FinEra Backend - Global Error Handler
 */

import type { Request, Response, NextFunction } from "express";
import type { ErrorCode } from "../types/index.js";
import { logger } from "../core/utils/logger.js";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: ErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function validationError(message: string, details?: Record<string, unknown>) {
  return new AppError(400, "VALIDATION_ERROR", message, details);
}

export function authError(message = "Authentication required") {
  return new AppError(401, "AUTHENTICATION_ERROR", message);
}

export function forbiddenError(message = "Access denied") {
  return new AppError(403, "AUTHORIZATION_ERROR", message);
}

export function notFoundError(message = "Resource not found") {
  return new AppError(404, "NOT_FOUND", message);
}

export function conflictError(message: string) {
  return new AppError(409, "CONFLICT", message);
}

export function rateLimitError(message = "Too many requests") {
  return new AppError(429, "RATE_LIMIT", message);
}

export function internalError(message = "Internal server error", details?: Record<string, unknown>) {
  return new AppError(500, "INTERNAL_ERROR", message, details);
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isProd = process.env.NODE_ENV === "production";

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        code: err.code,
        ...(isProd ? {} : { details: err.details }),
      },
    });
    return;
  }

  logger.error({ err: err.message, stack: err.stack }, "Unhandled error");

  res.status(500).json({
    success: false,
    message: isProd ? "Internal server error" : err.message,
    error: {
      code: "INTERNAL_ERROR",
      ...(isProd ? {} : { details: { stack: err.stack } }),
    },
  });
}
