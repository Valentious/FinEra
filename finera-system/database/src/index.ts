/**
 * FinEra Database Package
 * Export client, services, and Prisma client
 */

export { db, getPrisma } from './lib/db/client.js';
export { WalletService } from './services/wallet.service.js';
export { PrismaClient } from '@prisma/client';
