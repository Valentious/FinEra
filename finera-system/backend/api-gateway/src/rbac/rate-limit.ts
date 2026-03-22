/**
 * FinEra RBAC - Role-based rate limiting
 */

import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { Role } from './roles.js';

const windowMs = 15 * 60 * 1000;

const createLimiter = (max: number) =>
  rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    keyGenerator: (req: Request) => {
      const user = (req as Request & { user?: { role: string; userId: string } }).user;
      return user ? `${user.role}:${user.userId}` : req.ip || 'anonymous';
    },
  });

export const rateLimiters = {
  [Role.USER]: createLimiter(Number(process.env.RATE_LIMIT_USER) || 100),
  [Role.ADMIN]: createLimiter(Number(process.env.RATE_LIMIT_ADMIN) || 500),
  [Role.SUPER_ADMIN]: createLimiter(Number(process.env.RATE_LIMIT_SUPER_ADMIN) || 2000),
};

export const anonymousLimiter = rateLimit({
  windowMs,
  max: 30,
  message: {
    success: false,
    error: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
});

export function roleBasedRateLimit(req: Request, res: Response, next: NextFunction): void {
  const user = (req as Request & { user?: { role: Role } }).user;
  if (!user) {
    return anonymousLimiter(req, res, next);
  }
  const limiter = rateLimiters[user.role];
  if (limiter) {
    return limiter(req, res, next);
  }
  next();
}
