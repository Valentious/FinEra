/**
 * FinEra RBAC - Authentication, Authorization, Resource Permission
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role, rolePermissions, toRbacRole } from './roles.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-in-production';

export interface UserContext {
  userId: string;
  email?: string;
  role: Role;
  permissions: typeof rolePermissions[Role];
  token: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
    }
  }
}

function extractToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.substring(7);
}

function verifyToken(token: string): { userId: string; email?: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email?: string; role: string };
  } catch {
    return null;
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'MISSING_TOKEN',
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  const role = toRbacRole(payload.role);
  req.user = {
    userId: payload.userId,
    email: payload.email,
    role,
    permissions: rolePermissions[role] || [],
    token,
  };
  next();
}

export function authorize(requiredRoles: Role | Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'NO_USER_CONTEXT',
      });
      return;
    }

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    if (!roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient permissions',
        code: 'INSUFFICIENT_ROLE',
        requiredRoles: roles,
        userRole: user.role,
      });
      return;
    }
    next();
  };
}

export function checkResourcePermission(req: Request, res: Response, next: NextFunction): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      code: 'NO_USER_CONTEXT',
    });
    return;
  }

  if (user.role === Role.SUPER_ADMIN) {
    next();
    return;
  }

  const path = req.path;
  const method = req.method;

  const hasPermission = user.permissions.some((p) => {
    const pattern = p.resource.replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(path) && (p.actions.includes(method) || p.actions.includes('*'));
  });

  if (!hasPermission) {
    res.status(403).json({
      success: false,
      error: 'Forbidden: Resource access denied',
      code: 'RESOURCE_ACCESS_DENIED',
      resource: path,
      method,
      userRole: user.role,
    });
    return;
  }
  next();
}
