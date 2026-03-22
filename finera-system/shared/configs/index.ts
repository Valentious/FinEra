/**
 * FinEra Shared Configuration
 * Environment variables and service URLs - single source of truth
 */

export const config = {
  env: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
    user: process.env.USER_SERVICE_URL || 'http://localhost:4002',
    credit: process.env.CREDIT_ENGINE_URL || 'http://localhost:4003',
    ledger: process.env.LEDGER_SERVICE_URL || 'http://localhost:4004',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4005',
    admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:4006',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
};
