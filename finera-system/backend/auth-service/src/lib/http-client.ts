/**
 * FinEra Service HTTP Client - Circuit breaker, retry, timeout
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

export interface ServiceConfig {
  name: string;
  baseUrl: string;
  timeout: number;
  retries: number;
}

const serviceRegistry: Record<string, ServiceConfig> = {
  user: {
    name: 'user-service',
    baseUrl: process.env.USER_SERVICE_URL || 'http://localhost:4002',
    timeout: 5000,
    retries: 3,
  },
  ledger: {
    name: 'ledger-service',
    baseUrl: process.env.LEDGER_SERVICE_URL || 'http://localhost:4004',
    timeout: 10000,
    retries: 5,
  },
  credit: {
    name: 'credit-engine',
    baseUrl: process.env.CREDIT_ENGINE_URL || 'http://localhost:4003',
    timeout: 8000,
    retries: 3,
  },
  admin: {
    name: 'admin-service',
    baseUrl: process.env.ADMIN_SERVICE_URL || 'http://localhost:4006',
    timeout: 5000,
    retries: 2,
  },
};

export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  service: string;
  statusCode: number;
}

class CircuitBreaker {
  private failures = new Map<string, number[]>();
  private states = new Map<string, 'CLOSED' | 'OPEN' | 'HALF_OPEN'>();
  private readonly threshold = 5;
  private readonly timeout = 60000;

  async call<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const state = this.states.get(name) || 'CLOSED';
    if (state === 'OPEN') {
      const last = this.failures.get(name)?.[0];
      if (last && Date.now() - last > this.timeout) this.states.set(name, 'HALF_OPEN');
      else throw new Error(`Circuit breaker OPEN for ${name}`);
    }
    try {
      const r = await fn();
      if (state === 'HALF_OPEN') {
        this.states.set(name, 'CLOSED');
        this.failures.set(name, []);
      }
      return r;
    } catch (e) {
      const f = this.failures.get(name) || [];
      f.push(Date.now());
      this.failures.set(name, f.slice(-10));
      if (f.length >= this.threshold) this.states.set(name, 'OPEN');
      throw e;
    }
  }
}

class ServiceClient {
  private clients = new Map<string, AxiosInstance>();
  private cb = new CircuitBreaker();

  constructor() {
    for (const [name, config] of Object.entries(serviceRegistry)) {
      const client = axios.create({
        baseURL: config.baseUrl,
        timeout: config.timeout,
        headers: { 'Content-Type': 'application/json', 'X-Service-Name': 'auth-service' },
      });
      client.interceptors.response.use(
        (r) => r,
        async (err) => {
          const cfg = err.config;
          if (!cfg?.retryCount) cfg.retryCount = 0;
          if (cfg.retryCount < (serviceRegistry[name]?.retries ?? 3)) {
            cfg.retryCount += 1;
            await new Promise((r) => setTimeout(r, Math.pow(2, cfg.retryCount) * 100));
            return client(cfg);
          }
          return Promise.reject(err);
        }
      );
      this.clients.set(name, client);
    }
  }

  async call<T>(
    name: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: unknown
  ): Promise<ServiceResponse<T>> {
    const client = this.clients.get(name);
    if (!client) throw new Error(`Service ${name} not registered`);

    return this.cb.call(name, async () => {
      try {
        let res: AxiosResponse;
        if (method === 'POST') res = await client.post(endpoint, data);
        else if (method === 'PUT') res = await client.put(endpoint, data);
        else if (method === 'DELETE') res = await client.delete(endpoint);
        else res = await client.get(endpoint);
        return { success: true, data: res.data, service: name, statusCode: res.status };
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string }; status?: number }; message?: string };
        return {
          success: false,
          error: err.response?.data?.message ?? err.message ?? 'Unknown',
          service: name,
          statusCode: err.response?.status ?? 500,
        };
      }
    });
  }

  async callWithRetry<T>(
    name: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: unknown,
    maxRetries = 3
  ): Promise<ServiceResponse<T>> {
    let last: ServiceResponse<T> | null = null;
    for (let i = 1; i <= maxRetries; i++) {
      const r = await this.call<T>(name, endpoint, method, data);
      if (r.success) return r;
      last = r;
      if (i < maxRetries) await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
    }
    return last!;
  }
}

export const serviceClient = new ServiceClient();
