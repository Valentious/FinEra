/**
 * FinEra Backend - Express Application
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { loadConfig, getConfig } from "../config/index.js";

loadConfig();
import { requestIdMiddleware, errorHandler } from "../middlewares/index.js";
import authRoutes from "../services/auth-service/auth.routes.js";
import userRoutes from "../services/user-service/user.routes.js";
import transactionRoutes from "../services/ledger-service/transaction.routes.js";
import walletRoutes from "../services/ledger-service/wallet.routes.js";
import creditRoutes from "../services/credit-engine/credit.routes.js";
import notificationRoutes from "../services/admin-service/notification.routes.js";
import kycRoutes from "../services/user-service/kyc.routes.js";
import referenceRoutes from "../services/user-service/reference.routes.js";
import learningRoutes from "../services/admin-service/learning.routes.js";
import partnerProgramRoutes from "../services/admin-service/partner-program.routes.js";
import currenciesRoutes from "../services/ledger-service/currencies.routes.js";

const app = express();

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "10mb" }));

const config = getConfig();
const allowedOrigins = [
  config.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5176",
  "http://127.0.0.1:5177",
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(null, allowedOrigins[0]);
      }
    },
    credentials: true,
  })
);

app.use(requestIdMiddleware);

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.RATE_LIMIT_AUTH,
  message: { success: false, message: "Too many attempts" },
});
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.RATE_LIMIT_GENERAL,
  message: { success: false, message: "Too many requests" },
});

app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/user", generalLimiter, userRoutes);
app.use("/api/v1/transactions", generalLimiter, transactionRoutes);
app.use("/api/v1/wallet", generalLimiter, walletRoutes);
app.use("/api/v1/credit", generalLimiter, creditRoutes);
app.use("/api/v1/notifications", generalLimiter, notificationRoutes);
app.use("/api/v1/kyc", generalLimiter, kycRoutes);
app.use("/api/v1/reference", generalLimiter, referenceRoutes);
app.use("/api/v1/learning", generalLimiter, learningRoutes);
app.use("/api/v1/partner-program", generalLimiter, partnerProgramRoutes);
app.use("/api/v1/currencies", generalLimiter, currenciesRoutes);

app.get("/api/registration-data", generalLimiter, async (_req, res) => {
  try {
    const ref = await import("../services/user-service/reference.data.js");
    const cities = ref.COUNTRIES.flatMap((c) => ref.getCitiesByCountry(c.id));
    const payload = { countries: ref.COUNTRIES, cities, institutions: ref.INSTITUTIONS };
    res.json(payload);
  } catch (err) {
    console.error("[registration-data] Failed:", err);
    res.status(500).json({ error: "Failed to load registration data" });
  }
});

app.get("/", (_req, res) => {
  res.json({
    name: "FinEra Inclusive Credit API",
    version: "1.0",
    docs: "/api/v1",
    health: "/health",
    ready: "/ready",
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/ready", async (_req, res) => {
  try {
    const { prisma } = await import("../infrastructure/database/index.js");
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "not ready" });
  }
});

app.use(errorHandler);

export default app;
