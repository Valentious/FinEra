/**
 * FinEra Service Registry & Discovery
 * Single source of truth for service URLs, timeouts, retries
 */

export interface ServiceConfig {
  name: string;
  baseUrl: string;
  timeout: number;
  retries: number;
  healthCheck: string;
}

export const serviceRegistry: Record<string, ServiceConfig> = {
  auth: {
    name: 'auth-service',
    baseUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
    timeout: 5000,
    retries: 3,
    healthCheck: '/health',
  },
  user: {
    name: 'user-service',
    baseUrl: process.env.USER_SERVICE_URL || 'http://localhost:4002',
    timeout: 5000,
    retries: 3,
    healthCheck: '/health',
  },
  ledger: {
    name: 'ledger-service',
    baseUrl: process.env.LEDGER_SERVICE_URL || 'http://localhost:4004',
    timeout: 10000,
    retries: 5,
    healthCheck: '/health',
  },
  credit: {
    name: 'credit-engine',
    baseUrl: process.env.CREDIT_ENGINE_URL || 'http://localhost:4003',
    timeout: 8000,
    retries: 3,
    healthCheck: '/health',
  },
  admin: {
    name: 'admin-service',
    baseUrl: process.env.ADMIN_SERVICE_URL || 'http://localhost:4006',
    timeout: 5000,
    retries: 2,
    healthCheck: '/health',
  },
};
