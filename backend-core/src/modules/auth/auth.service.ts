/**
 * FinEra Backend - Authentication Service
 *
 * CORE PRINCIPLES:
 * - Primary key (user_id/id) is the ONLY identity anchor
 * - Secondary keys (email, phone) are UNIQUE but NOT identity
 * - Password belongs to USER (user_id), not email
 * - Login: STEP 1 fetch by email, STEP 2 validate password (never together)
 */

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getConfig } from "../../config/index.js";
import type { AccountType } from "@prisma/client";
import {
  conflictError,
  authError,
  userNotFoundError,
  invalidPasswordError,
  accountInactiveError,
  accountLockedError,
} from "../../middlewares/errorHandler.js";
import type { JwtPayload } from "../../types/index.js";
import * as authRepo from "./auth.repository.js";
import { logLoginAttempt } from "./auth.audit.js";

const SALT_ROUNDS = 12;

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  accountType: AccountType;
  country: string;
  city?: string;
  institution?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  deviceId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** Normalize email: lowercase, trim. Enforced before any DB operation. */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Register: validate, normalize email, hash password (bcrypt), create user.
 * Password hash depends ONLY on user_id (created at insert).
 */
export async function register(data: RegisterInput): Promise<{ userId: string; email: string }> {
  const email = normalizeEmail(data.email);
  const existing = await authRepo.findUserByEmail(email);
  if (existing) throw conflictError("Email already registered");

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const { prisma } = await import("../../infrastructure/database/index.js");
  const user = await prisma.user.create({
    data: {
      email,
      fullName: data.fullName.trim(),
      accountType: data.accountType,
      countryCode: data.country,
      city: data.city?.trim(),
      institution: data.institution?.trim(),
      passwordHash,
      status: "ACTIVE",
    },
  });

  const currencies = ["USD", "ZIG", "ZAR"] as const;
  for (let i = 0; i < currencies.length; i++) {
    const accountNumber = `FIN${Date.now().toString().slice(-8)}${Math.random().toString().slice(2, 6)}${i}`;
    await prisma.wallet.create({
      data: { userId: user.id, currencyCode: currencies[i], accountNumber },
    });
  }

  return { userId: user.id, email: user.email };
}

/**
 * Login: STRICT 2-step flow.
 * STEP 1: Fetch user by email (secondary key)
 * STEP 2: Validate password with bcrypt.compare (never in SQL)
 * Distinct errors: USER_NOT_FOUND | INVALID_PASSWORD | ACCOUNT_INACTIVE
 */
export async function login(
  data: LoginInput,
  meta?: { ip?: string; userAgent?: string }
): Promise<AuthTokens> {
  const email = normalizeEmail(data.email);

  // STEP 1: Fetch user by email only - never query password in same step
  const user = await authRepo.findUserByEmail(email);

  if (!user) {
    logLoginAttempt({
      email,
      outcome: "USER_NOT_FOUND",
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });
    throw userNotFoundError("User not found");
  }

  if (user.status !== "ACTIVE") {
    logLoginAttempt({
      email,
      outcome: "ACCOUNT_INACTIVE",
      userId: user.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });
    throw accountInactiveError("Account is not active");
  }

  // Pre-validation: account lockout (prevents brute-force before CPU-heavy bcrypt)
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    logLoginAttempt({
      email,
      outcome: "ACCOUNT_LOCKED",
      userId: user.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });
    throw accountLockedError("Account temporarily locked due to too many failed attempts.");
  }

  // STEP 2: Validate password - compare input with stored hash (bcrypt)
  const valid = await bcrypt.compare(data.password, user.passwordHash);

  if (!valid) {
    logLoginAttempt({
      email,
      outcome: "INVALID_PASSWORD",
      userId: user.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });
    await authRepo.incrementFailedLogin(user.id);
    throw invalidPasswordError("Incorrect password");
  }

  logLoginAttempt({
    email,
    outcome: "SUCCESS",
    userId: user.id,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
  });

  await authRepo.updateLastLogin(user.id, meta?.ip);

  return generateTokens(user.id, user.email);
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const config = getConfig();

  const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as JwtPayload;
  if (decoded.type !== "refresh") throw authError("Invalid refresh token");

  const user = await authRepo.findUserById(decoded.sub);
  if (!user || user.refreshToken !== refreshToken) throw authError("Invalid refresh token");

  return generateTokens(user.id, user.email);
}

export async function logout(refreshToken: string): Promise<void> {
  const user = await (await import("../../infrastructure/database/index.js")).prisma.user.findFirst({
    where: { refreshToken },
    select: { id: true },
  });
  if (user) {
    await authRepo.setRefreshToken(user.id, null);
  }
}

function generateTokens(userId: string, email: string): AuthTokens {
  const config = getConfig();
  const accessPayload: JwtPayload = { sub: userId, email, type: "access" };
  const refreshPayload: JwtPayload = { sub: userId, email, type: "refresh" };

  const accessToken = jwt.sign(accessPayload, config.JWT_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRY,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(refreshPayload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRY,
  } as jwt.SignOptions);

  const decoded = jwt.decode(accessToken) as { exp?: number; iat?: number };
  const expiresIn = decoded?.exp && decoded?.iat ? decoded.exp - decoded.iat : 900;

  return { accessToken, refreshToken, expiresIn };
}
