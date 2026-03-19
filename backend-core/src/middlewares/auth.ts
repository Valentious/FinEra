/**
 * FinEra Backend - JWT Authentication Middleware
 */

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types/index.js";
import { getConfig } from "../config/index.js";
import { authError, forbiddenError } from "./errorHandler.js";
import { prisma } from "../infrastructure/database/index.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; accountType: string };
    }
  }
}

export async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next(authError("Missing or invalid authorization header"));
    return;
  }

  const token = authHeader.slice(7);
  const config = getConfig();

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    if (decoded.type !== "access") {
      next(authError("Invalid token type"));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, accountType: true, status: true },
    });

    if (!user) {
      next(authError("User not found"));
      return;
    }

    if (user.status !== "ACTIVE") {
      next(forbiddenError("Account is not active"));
      return;
    }

    req.user = { id: user.id, email: user.email, accountType: user.accountType };
    next();
  } catch {
    next(authError("Invalid or expired token"));
  }
}
