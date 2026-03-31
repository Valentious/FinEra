/**
 * JWT auth for staff (`AdminUser`). Tokens include `kind: "admin"` and `role`.
 */

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AdminRole } from "@prisma/client";
import { getConfig } from "../config/index.js";
import { authError, forbiddenError } from "./errorHandler.js";
import { prisma } from "../infrastructure/database/index.js";

/** HTTP-only admin session cookie (set by POST /admin/auth/login). */
export const ADMIN_ACCESS_COOKIE = "finera_admin_access";

export interface AdminJwtPayload {
  sub: string;
  email: string;
  type: "access";
  kind: "admin";
  role: AdminRole;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      admin?: { id: string; email: string; role: AdminRole };
    }
  }
}

function readAdminToken(req: Request): string | undefined {
  const fromCookie = req.cookies?.[ADMIN_ACCESS_COOKIE];
  if (typeof fromCookie === "string" && fromCookie.length > 0) return fromCookie;
  return undefined;
}

export async function adminAuthMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = readAdminToken(req);
  if (!token) {
    next(authError("Missing admin session"));
    return;
  }
  const config = getConfig();
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as AdminJwtPayload;
    if (decoded.type !== "access" || decoded.kind !== "admin") {
      next(authError("Invalid token for admin"));
      return;
    }
    const admin = await prisma.adminUser.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (!admin || !admin.isActive) {
      next(forbiddenError("Admin account inactive or not found"));
      return;
    }
    req.admin = { id: admin.id, email: admin.email, role: admin.role };
    next();
  } catch {
    next(authError("Invalid or expired token"));
  }
}

export function requireAdminRole(...roles: AdminRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.admin) {
      next(forbiddenError("Admin context required"));
      return;
    }
    if (!roles.includes(req.admin.role)) {
      next(forbiddenError("Insufficient role for this action"));
      return;
    }
    next();
  };
}
