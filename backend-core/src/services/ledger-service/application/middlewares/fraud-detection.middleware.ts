/**
 * FinEra - Fraud Detection Middleware
 */

import type { Request, Response, NextFunction } from "express";
import { FraudDetectionService } from "../services/fraud-detection.service.js";
import { forbiddenError } from "../../../../shared/errors.js";

const fraudService = new FraudDetectionService();

export async function fraudDetectionMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const user = (req as Request & { user?: { id: string } }).user;
  const context = {
    userId: user?.id,
    ipAddress: (req.headers["x-forwarded-for"] as string) ?? req.socket.remoteAddress ?? "unknown",
    userAgent: req.headers["user-agent"] ?? "",
    deviceFingerprint: (req.headers["x-device-fingerprint"] as string) ?? "",
    endpoint: req.path,
    requestBody: req.body,
    timestamp: new Date(),
  };

  try {
    const result = await fraudService.analyze(context);
    (req as Request & { fraudResult?: typeof result }).fraudResult = result;

    if (result.action === "BLOCK") {
      next(forbiddenError("Transaction blocked for security review"));
      return;
    }
    next();
  } catch {
    next();
  }
}
