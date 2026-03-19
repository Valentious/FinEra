/**
 * FinEra Backend - Environment Configuration
 * Validates all required env vars at startup
 */

import { z } from "zod";

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
