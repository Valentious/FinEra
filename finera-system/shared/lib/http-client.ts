/**
 * FinEra Service HTTP Client
 * Circuit breaker, retry with exponential backoff, timeout handling
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { serviceRegistry, type ServiceConfig } from '../config/services.config.js';

export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  service: string;
  statusCode: number;
}

class CircuitBreaker {
  private failures: Map<string, number[]> = new Map();
  private states: Map<string, 'CLOSED' | 'OPEN' | 'HALF_OPEN'> = new Map();
  private readonly failureThreshold = 5;
  private readonly timeout = 60000;

  async call<T>(serviceName: string, fn: () => Promise<T>): Promise<T> {
    const state = this.states.get(serviceName) || 'CLOSED';

    if (state === 'OPEN') {
      const lastFailure = this.failures.get(serviceName)?.[0];
      if (lastFailure && Date.now() - lastFailure > this.timeout) {
        this.states.set(serviceName, 'HALF_OPEN');
      } else {
        throw new Error(`Circuit breaker OPEN for ${serviceName}`);
      }
    }

    try {
      const result = await fn();
      if (state === 'HALF_OPEN') {
        this.states.set(serviceName, 'CLOSED');
        this.failures.set(serviceName, []);
      }
      return result;
    } catch (error) {
      this.recordFailure(serviceName);
      throw error;
    }
  }

  private recordFailure(serviceName: string): void {
    const failures = this.failures.get(serviceName) || [];
    failures.push(Date.now());
    const recent = failures.slice(-10);
    this.failures.set(serviceName, recent);
    if (recent.length >= this.failureThreshold) {
      this.states.set(serviceName, 'OPEN');
    }
  }
}

export class ServiceClient {
  private clients: Map<string, AxiosInstance> = new Map();
  private circuitBreaker = new CircuitBreaker();

  constructor() {
    for (const [name, config] of Object.entries(serviceRegistry)) {
      const client = axios.create({
        baseURL: config.baseUrl,
        timeout: config.timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Name': 'auth-service',
        },
      });

      client.interceptors.response.use(
        (r) => r,
        async (error) => {
          const config = error.config;
          if (!config?.retryCount) config.retryCount = 0;
          const retries = (serviceRegistry[name]?.retries ?? 3);
          if (config.retryCount < retries) {
            config.retryCount += 1;
            await new Promise((r) => setTimeout(r, Math.pow(2, config.retryCount) * 100));
            return client(config);
          }
          return Promise.reject(error);
        }
      );
      this.clients.set(name, client);
    }
  }

  async call<T>(
    serviceName: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ServiceResponse<T>> {
    const client = this.clients.get(serviceName);
    if (!client) throw new Error(`Service ${serviceName} not registered`);

    return this.circuitBreaker.call(serviceName, async () => {
      try {
        let response: AxiosResponse;
        switch (method) {
          case 'POST':
            response = await client.post(endpoint, data, config);
            break;
          case 'PUT':
            response = await client.put(endpoint, data, config);
            break;
          case 'DELETE':
            response = await client.delete(endpoint, config);
            break;
          default:
            response = await client.get(endpoint, config);
        }
        return {
          success: true,
          data: response.data,
          service: serviceName,
          statusCode: response.status,
        };
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string }; status?: number }; message?: string };
        return {
          success: false,
          error: error.response?.data?.message ?? error.message ?? 'Unknown error',
          service: serviceName,
          statusCode: error.response?.status ?? 500,
        };
      }
    });
  }

  async callWithRetry<T>(
    serviceName: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: unknown,
    maxRetries = 3
  ): Promise<ServiceResponse<T>> {
    let last: ServiceResponse<T> | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.call<T>(serviceName, endpoint, method, data);
      if (result.success) return result;
      last = result;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
    return last!;
  }
}

export const serviceClient = new ServiceClient();
