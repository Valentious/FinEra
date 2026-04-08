/**
 * Security middleware helpers for fintech-grade HTTP baseline.
 * Keeps configuration centralized and composable.
 */
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import type { Config } from "../../config/index.js";

export function buildCorsOptions(config: Config): CorsOptions {
  const allow = new Set([
    config.FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "http://127.0.0.1:5177",
  ]);

  return {
    origin: (origin, cb) => {
      if (!origin || allow.has(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  };
}

export function buildHelmet(config: Config) {
  return helmet({
    hsts: config.NODE_ENV === "production",
    referrerPolicy: { policy: "no-referrer" },
  });
}

export function buildRateLimiter(max: number, message: string) {
  return rateLimit({
    windowMs: 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
  });
}

export const corsMiddleware = cors;

