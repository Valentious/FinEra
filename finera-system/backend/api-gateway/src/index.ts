/**
 * FinEra API Gateway - Enterprise RBAC
 * Single entry point, JWT auth, role-based access, rate limiting, audit logging
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Role, rolePermissions, getRoleHierarchy } from './rbac/roles.js';
import {
  authenticate,
  authorize,
  checkResourcePermission,
  type UserContext,
} from './rbac/middleware.js';
import { roleBasedRateLimit } from './rbac/rate-limit.js';
import { auditLogSensitiveOperations } from './rbac/audit.js';

const app = express();
const PORT = process.env.PORT || 5000;

const origins = process.env.ALLOWED_ORIGINS?.split(',') || [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
];

app.use(helmet());
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json());

// Forward user context to downstream services
function userContext(req: express.Request, _res: express.Response, next: express.NextFunction) {
  const user = (req as express.Request & { user?: UserContext }).user;
  if (user) {
    req.headers['x-user-id'] = user.userId;
    req.headers['x-user-role'] = user.role;
    if (user.email) req.headers['x-user-email'] = user.email;
  }
  next();
}

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
const USER_URL = process.env.USER_SERVICE_URL || 'http://localhost:4002';
const CREDIT_URL = process.env.CREDIT_ENGINE_URL || 'http://localhost:4003';
const LEDGER_URL = process.env.LEDGER_SERVICE_URL || 'http://localhost:4004';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4005';
const ADMIN_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:4006';

// Health (no auth)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// Permissions endpoint (must be before auth proxy - gateway-handled)
app.get(
  '/api/v1/auth/me/permissions',
  roleBasedRateLimit,
  authenticate,
  (req, res) => {
    const user = (req as express.Request & { user: UserContext }).user;
    res.json({
      success: true,
      data: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        roleHierarchy: getRoleHierarchy(user.role),
      },
    });
  }
);

// Public: Auth (login, register)
app.use(
  '/api/v1/auth',
  roleBasedRateLimit,
  createProxyMiddleware({
    target: AUTH_URL,
    changeOrigin: true,
    on: {
      error: (err: Error, _req: express.Request, res: express.Response) => {
        console.error('Auth proxy error:', err);
        (res as express.Response).status(502).json({
          success: false,
          error: 'Service temporarily unavailable',
          code: 'PROXY_ERROR',
        });
      },
    },
  } as any)
);

// User routes (USER+)
app.use(
  '/api/v1/users',
  roleBasedRateLimit,
  authenticate,
  authorize([Role.USER, Role.ADMIN, Role.SUPER_ADMIN]),
  checkResourcePermission,
  userContext,
  createProxyMiddleware({
    target: USER_URL,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq: import('http').ClientRequest, req: express.Request) => {
        const user = (req as express.Request & { user?: UserContext }).user;
        if (user) {
          proxyReq.setHeader('X-User-Id', user.userId);
          proxyReq.setHeader('X-User-Role', user.role);
          if (user.email) proxyReq.setHeader('X-User-Email', user.email);
        }
      },
      error: (err: Error, _req: express.Request, res: express.Response) => {
        console.error('User proxy error:', err);
        (res as express.Response).status(502).json({
          success: false,
          error: 'Service temporarily unavailable',
          code: 'PROXY_ERROR',
        });
      },
    },
  } as any)
);

// Credit (USER+)
app.use(
  '/api/v1/credit',
  roleBasedRateLimit,
  authenticate,
  authorize([Role.USER, Role.ADMIN, Role.SUPER_ADMIN]),
  checkResourcePermission,
  userContext,
  createProxyMiddleware({
    target: CREDIT_URL,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq: import('http').ClientRequest, req: express.Request) => {
        const user = (req as express.Request & { user?: UserContext }).user;
        if (user) {
          proxyReq.setHeader('X-User-Id', user.userId);
          proxyReq.setHeader('X-User-Role', user.role);
        }
      },
      error: (err: Error, _req: express.Request, res: express.Response) => {
        console.error('Credit proxy error:', err);
        (res as express.Response).status(502).json({
          success: false,
          error: 'Service temporarily unavailable',
          code: 'PROXY_ERROR',
        });
      },
    },
  } as any)
);

// Ledger (USER+)
app.use(
  '/api/v1/ledger',
  roleBasedRateLimit,
  authenticate,
  authorize([Role.USER, Role.ADMIN, Role.SUPER_ADMIN]),
  checkResourcePermission,
  userContext,
  createProxyMiddleware({
    target: LEDGER_URL,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq: import('http').ClientRequest, req: express.Request) => {
        const user = (req as express.Request & { user?: UserContext }).user;
        if (user) {
          proxyReq.setHeader('X-User-Id', user.userId);
          proxyReq.setHeader('X-User-Role', user.role);
        }
      },
      error: (err: Error, _req: express.Request, res: express.Response) => {
        console.error('Ledger proxy error:', err);
        (res as express.Response).status(502).json({
          success: false,
          error: 'Service temporarily unavailable',
          code: 'PROXY_ERROR',
        });
      },
    },
  } as any)
);

// Notifications (USER+)
app.use(
  '/api/v1/notifications',
  roleBasedRateLimit,
  authenticate,
  authorize([Role.USER, Role.ADMIN, Role.SUPER_ADMIN]),
  checkResourcePermission,
  userContext,
  createProxyMiddleware({
    target: NOTIFICATION_URL,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq: import('http').ClientRequest, req: express.Request) => {
        const user = (req as express.Request & { user?: UserContext }).user;
        if (user) {
          proxyReq.setHeader('X-User-Id', user.userId);
          proxyReq.setHeader('X-User-Role', user.role);
        }
      },
      error: (err: Error, _req: express.Request, res: express.Response) => {
        console.error('Notification proxy error:', err);
        (res as express.Response).status(502).json({
          success: false,
          error: 'Service temporarily unavailable',
          code: 'PROXY_ERROR',
        });
      },
    },
  } as any)
);

// Admin: List roles (SUPER_ADMIN only) - must be before admin proxy
app.get(
  '/api/v1/admin/roles',
  roleBasedRateLimit,
  authenticate,
  authorize(Role.SUPER_ADMIN),
  (req, res) => {
    res.json({
      success: true,
      data: {
        roles: Object.values(Role),
        permissions: rolePermissions,
        roleHierarchy: {
          [Role.USER]: getRoleHierarchy(Role.USER),
          [Role.ADMIN]: getRoleHierarchy(Role.ADMIN),
          [Role.SUPER_ADMIN]: getRoleHierarchy(Role.SUPER_ADMIN),
        },
      },
    });
  }
);

// Admin routes (ADMIN+), with audit
app.use(
  '/api/v1/admin',
  roleBasedRateLimit,
  authenticate,
  authorize([Role.ADMIN, Role.SUPER_ADMIN]),
  checkResourcePermission,
  auditLogSensitiveOperations,
  userContext,
  createProxyMiddleware({
    target: ADMIN_URL,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq: import('http').ClientRequest, req: express.Request) => {
        const user = (req as express.Request & { user?: UserContext }).user;
        if (user) {
          proxyReq.setHeader('X-User-Id', user.userId);
          proxyReq.setHeader('X-User-Role', user.role);
          if (user.email) proxyReq.setHeader('X-User-Email', user.email);
        }
      },
      error: (err: Error, _req: express.Request, res: express.Response) => {
        console.error('Admin proxy error:', err);
        (res as express.Response).status(502).json({
          success: false,
          error: 'Service temporarily unavailable',
          code: 'PROXY_ERROR',
        });
      },
    },
  } as any)
);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found', code: 'NOT_FOUND' });
});

// Error handler
app.use((err: Error & { status?: number }, _req: express.Request, res: express.Response) => {
  console.error('Gateway error:', err);
  const status = err.status ?? 500;
  res.status(status).json({
    success: false,
    error: status === 401 ? 'Unauthorized' : status === 403 ? 'Forbidden' : 'Internal server error',
    code: status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : 'INTERNAL_ERROR',
  });
});

app.listen(PORT, () => {
  console.log(`FinEra API Gateway: http://localhost:${PORT}`);
  console.log(`RBAC: ${Object.values(Role).join(', ')}`);
});
