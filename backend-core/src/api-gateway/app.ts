/**
 * FinEra Backend - Express Application
 */

import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
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
import ledgerSystemRoutes from "../services/ledger-service/ledger-system.routes.js";
import adminAuthRoutes from "../services/admin-service/admin-auth.routes.js";
import adminDashboardRoutes from "../services/admin-service/admin-dashboard.routes.js";
import adminDocumentsRoutes from "../services/admin-service/admin-documents.routes.js";
import memberDocumentsRoutes from "../services/member-documents/member-documents.routes.js";
import { logger } from "../core/utils/logger.js";
import { buildCorsOptions, buildHelmet, buildRateLimiter, corsMiddleware } from "../middleware/security/index.js";

const app = express();

app.set("trust proxy", 1);
app.use(buildHelmet(getConfig()));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));

const config = getConfig();
app.use(corsMiddleware(buildCorsOptions(config)));

app.use(requestIdMiddleware);

const authLimiter = buildRateLimiter(config.RATE_LIMIT_AUTH, "Too many attempts");
const generalLimiter = buildRateLimiter(config.RATE_LIMIT_GENERAL, "Too many requests");
const walletLimiter = buildRateLimiter(config.RATE_LIMIT_WALLET, "Too many wallet requests");
const creditLimiter = buildRateLimiter(config.RATE_LIMIT_CREDIT, "Too many credit requests");
const ledgerLimiter = buildRateLimiter(config.RATE_LIMIT_LEDGER, "Too many ledger requests");
const adminLimiter = buildRateLimiter(config.RATE_LIMIT_ADMIN, "Too many admin requests");

app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/user", generalLimiter, userRoutes);
app.use("/api/v1/transactions", generalLimiter, transactionRoutes);
app.use("/api/v1/wallet", walletLimiter, walletRoutes);
app.use("/api/v1/credit", creditLimiter, creditRoutes);
app.use("/api/v1/notifications", generalLimiter, notificationRoutes);
app.use("/api/v1/kyc", generalLimiter, kycRoutes);
app.use("/api/v1/reference", generalLimiter, referenceRoutes);
app.use("/api/v1/learning", generalLimiter, learningRoutes);
app.use("/api/v1/partner-program", generalLimiter, partnerProgramRoutes);
app.use("/api/v1/currencies", generalLimiter, currenciesRoutes);
app.use("/api/v1/ledger", ledgerLimiter, ledgerSystemRoutes);
app.use("/api/v1/admin/auth", authLimiter, adminAuthRoutes);
app.use("/api/v1/admin", adminLimiter, adminDocumentsRoutes, adminDashboardRoutes);
app.use("/api/v1/member-documents", generalLimiter, memberDocumentsRoutes);

app.get("/api/registration-data", generalLimiter, async (_req, res) => {
  try {
    const ref = await import("../services/user-service/reference.data.js");
    const cities = ref.COUNTRIES.flatMap((c) => ref.getCitiesByCountry(c.id));
    const payload = { countries: ref.COUNTRIES, cities, institutions: ref.INSTITUTIONS };
    res.json(payload);
  } catch (err) {
    logger.error(
      { event: "registration_data_failed", err: err instanceof Error ? err.message : String(err) },
      "Failed to load registration data"
    );
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
