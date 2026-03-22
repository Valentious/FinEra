/**
 * FinEra RBAC - Audit logging for sensitive operations
 */

import type { Request, Response, NextFunction } from 'express';
import { Role } from './roles.js';

const ADMIN_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:4006';

const sensitivePaths = [
  /^\/api\/v1\/admin/,
  /^\/api\/v1\/system/,
  /\/delete$/,
  /\/reverse$/,
];

export function auditLogSensitiveOperations(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = (req as Request & { user?: { userId: string; role: string; token: string } }).user;
  const shouldAudit = sensitivePaths.some((re) => re.test(req.path));

  if (shouldAudit && user) {
    const entry = {
      userId: user.userId,
      action: `${req.method} ${req.path}`,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      role: user.role,
    };
    console.log('[AUDIT]', entry);

    fetch(`${ADMIN_URL}/api/v1/admin/audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': user.userId,
        'X-User-Role': user.role,
      },
      body: JSON.stringify({
        userId: user.userId,
        action: entry.action,
        entityType: 'API_REQUEST',
        entityId: req.path,
        metadata: {
          method: req.method,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      }),
    }).catch((err) => console.error('Audit log failed:', err));
  }
  next();
}
