/**
 * FinEra - Database Infrastructure
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { forbiddenError } from "../../middlewares/errorHandler.js";

/** Same default as `.env.example` — only when unset (local dev). Production must set DATABASE_URL. */
const DEFAULT_DEV_DATABASE_URL = "postgresql://finera:finera_secure@localhost:5432/finera_db";

const rawUrl = process.env.DATABASE_URL?.trim();
const DATABASE_URL =
  rawUrl ||
  (process.env.NODE_ENV !== "production" ? DEFAULT_DEV_DATABASE_URL : undefined);

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Copy backend-core/.env.example to backend-core/.env or set DATABASE_URL."
  );
}

if (!rawUrl && process.env.NODE_ENV !== "production") {
  process.env.DATABASE_URL = DATABASE_URL;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function transactionIdFromWhere(where: unknown): string | undefined {
  if (!where || typeof where !== "object") return undefined;
  const w = where as { id?: unknown };
  return typeof w.id === "string" ? w.id : undefined;
}

function createClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  });

  client.$use(async (params, next) => {
    if (params.model === "Transaction") {
      const id = transactionIdFromWhere(params.args?.where as unknown);
      if (id && (params.action === "update" || params.action === "upsert")) {
        const rows = await client.$queryRaw<[{ ledger_entry_hash: string | null }]>(
          Prisma.sql`SELECT ledger_entry_hash FROM "Transaction" WHERE id = ${id}::uuid`
        );
        if (rows[0]?.ledger_entry_hash) {
          throw forbiddenError("Sealed ledger transaction cannot be modified");
        }
      }
      if (id && (params.action === "delete" || params.action === "deleteMany")) {
        const rows = await client.$queryRaw<[{ ledger_entry_hash: string | null }]>(
          Prisma.sql`SELECT ledger_entry_hash FROM "Transaction" WHERE id = ${id}::uuid`
        );
        if (rows[0]?.ledger_entry_hash) {
          throw forbiddenError("Sealed ledger transaction cannot be deleted");
        }
      }
    }
    return next(params);
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
