/**
 * FinEra Database Connection - Production-Ready
 * Connection pooling, transaction retry, health check
 * Uses standard PrismaClient (works with local PostgreSQL and Neon/serverless)
 */

import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private prisma: PrismaClient;
  private isConnected = false;

  private constructor() {
    const poolSize = parseInt(process.env.DATABASE_POOL_SIZE || '20', 10);
    const connectionTimeout = parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30', 10) * 1000;

    this.prisma = global.prisma ?? new PrismaClient({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
      errorFormat: 'pretty',
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    if (process.env.NODE_ENV !== 'production') {
      global.prisma = this.prisma;
    }
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.prisma.$connect();
      this.isConnected = true;
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting database:', error);
      throw error;
    }
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  public async transaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          return await fn(tx as PrismaClient);
        });
      } catch (error) {
        lastError = error as Error;
        console.warn(`Transaction attempt ${attempt} failed:`, (error as Error).message);

        if (attempt === maxRetries) break;

        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }

    throw lastError ?? new Error('Transaction failed');
  }
}

export const db = DatabaseConnection.getInstance();
export const getPrisma = () => db.getClient();
