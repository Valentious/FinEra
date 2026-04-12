/**
 * FinEra Backend - Environment Configuration
 * Validates all required env vars at startup
 */

import { z } from "zod";

/**
 * Treat empty env vars as "unset" so optional URLs can be left blank in .env
 * (common in local development, e.g. RABBITMQ_URL=).
 */
const optionalUrl = z.preprocess((v) => {
  if (typeof v !== "string") return v;
  const t = v.trim();
  return t === "" ? undefined : t;
}, z.string().url().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().url().optional().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  ENCRYPTION_KEY: z.string().length(32).optional(),
  BCRYPT_SALT_ROUNDS: z.coerce.number().min(10).max(14).default(12),
  FRONTEND_URL: z.string().url().default("http://localhost:5175"),
  RATE_LIMIT_AUTH: z.coerce.number().default(5),
  RATE_LIMIT_GENERAL: z.coerce.number().default(100),
  RATE_LIMIT_WALLET: z.coerce.number().default(60),
  RATE_LIMIT_CREDIT: z.coerce.number().default(40),
  RATE_LIMIT_LEDGER: z.coerce.number().default(60),
  RATE_LIMIT_ADMIN: z.coerce.number().default(120),
  /** amqp://user:pass@host:5672/vhost - when set, domain events use RabbitMQ (durable + DLQ). */
  RABBITMQ_URL: optionalUrl,
  /** Consumer attempts before DLQ (attempt 0 … max-1, then poison). */
  RABBITMQ_RETRY_MAX: z.coerce.number().min(1).max(20).default(3),
  /** Retry queue TTL (ms) before message is dead-lettered back to `replay`. */
  RABBITMQ_RETRY_DELAY_MS: z.coerce.number().min(1000).max(600_000).default(30_000),
  /**
   * Dev/prototype only: admin login accepts any password (and any email if no AdminUser matches - uses first admin).
   * Forced off when NODE_ENV is production.
   */
  ADMIN_PROTO_LOGIN: z.preprocess((v) => v === true || v === "true", z.boolean()).default(false),
  /** Consecutive missed installments (per loan delinquencyStage) before default + employer notification. */
  MISSED_REPAYMENTS_FOR_DEFAULT: z.coerce.number().min(1).max(24).default(3),
});

export type Config = z.infer<typeof envSchema>;

let config: Config | null = null;

export function loadConfig(): Config {
  if (config) return config;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Environment validation failed:", parsed.error.flatten());
    throw new Error("Invalid environment configuration");
  }
  config = parsed.data;
  return config;
}

export function getConfig(): Config {
  if (!config) return loadConfig();
  return config;
}
