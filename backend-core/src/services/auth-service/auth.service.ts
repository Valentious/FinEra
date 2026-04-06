/**
 * FinEra Backend - Authentication Service
 *
 * Registration creates users in PENDING_VERIFICATION; email OTP (bcrypt-hashed in DB) must be
 * verified before status becomes ACTIVE and login is allowed.
 */

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getConfig } from "../../config/index.js";
import {
  AppError,
  conflictError,
  authError,
  userNotFoundError,
  invalidPasswordError,
  accountInactiveError,
  accountLockedError,
  validationError,
} from "../../middlewares/errorHandler.js";
import type { JwtPayload } from "../../types/index.js";
import * as authRepo from "./auth.repository.js";
import { logLoginAttempt } from "./auth.audit.js";
import { sendOtpEmail, logDevOtpFallback, maskEmailForLog } from "./email-delivery.js";
import { logger } from "../../core/utils/logger.js";
import { assertHourlyOtpLimit, recordOtpSend } from "./otp-rate-limit.js";
import type { RegisterInput } from "./auth.validation.js";
import { createUserCurrencyAccountStack } from "../ledger-service/account-stack.service.js";
import { publishDomainEvent } from "../../infrastructure/messaging/event-bus.js";

const SALT_ROUNDS = 12;
const OTP_BCRYPT_ROUNDS = 10;
const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;

/** When true, any 6-digit code verifies (dev / progress only). Off in production unless explicitly enabled. */
function emailOtpAcceptAny(): boolean {
  const v = process.env.EMAIL_OTP_ACCEPT_ANY;
  if (v === "false" || v === "0") return false;
  if (v === "true" || v === "1") return true;
  return process.env.NODE_ENV === "development";
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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function hashEmailOtp(code: string): Promise<string> {
  return bcrypt.hash(code, OTP_BCRYPT_ROUNDS);
}

function parseDateOfBirth(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) throw validationError("Invalid date of birth");
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
    throw validationError("Invalid date of birth");
  }
  return dt;
}

/**
 * Send OTP email; in development may log OTP if provider missing (same behavior as legacy flow).
 */
async function deliverRegistrationOtp(to: string, code: string): Promise<void> {
  try {
    const result = await sendOtpEmail(to, code);
    if (result.ok) {
      logger.info(
        { event: "registration_otp_sent", to: maskEmailForLog(to), provider: result.provider },
        "Registration OTP email accepted by provider"
      );
      return;
    }
    const isDev = process.env.NODE_ENV === "development";
    if (isDev && process.env.EMAIL_DEV_FALLBACK_LOG !== "false") {
      logDevOtpFallback(to, code, "no_email_provider_configured");
      return;
    }
    logger.error({ to: maskEmailForLog(to) }, "Registration OTP not sent: no provider in production");
    throw validationError(
      "Failed to send verification email. Email service is not configured. Contact support."
    );
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error(
      {
        event: "registration_otp_failed",
        to: maskEmailForLog(to),
        err: err instanceof Error ? err.message : String(err),
      },
      "Registration OTP email delivery failed"
    );
    const isDev = process.env.NODE_ENV === "development";
    if (isDev && process.env.EMAIL_DEV_FALLBACK_LOG !== "false") {
      logDevOtpFallback(to, code, err instanceof Error ? err.message : "send_failed");
      return;
    }
    throw validationError("Failed to send verification email. Try again later.");
  }
}

export async function register(data: RegisterInput): Promise<{ userId: string; email: string }> {
  const email = normalizeEmail(data.email);
  assertHourlyOtpLimit(email);

  const existing = await authRepo.findUserByEmail(email);
  if (existing) throw conflictError("Email already registered");

  const { prisma } = await import("../../infrastructure/database/index.js");

  const phone = data.phoneNumber.trim();
  if (phone.length > 0) {
    const phoneTaken = await prisma.user.findFirst({
      where: { phoneNumber: phone },
      select: { id: true },
    });
    if (phoneTaken) throw conflictError("Phone number already registered");
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const dateOfBirth = parseDateOfBirth(data.dateOfBirth);
  const plainOtp = generateOtp();
  const otpHash = await hashEmailOtp(plainOtp);
  const now = new Date();
  const expiry = new Date(now.getTime() + OTP_TTL_MS);
  const walletCurrencies = ["USD", "ZIG", "ZAR"] as const;

  const user = await prisma.$transaction(async (tx) => {
    const accountMode = data.accountMode === "demo" ? "demo" : "real";
    const u = await tx.user.create({
      data: {
        email,
        fullName: data.fullName.trim(),
        accountType: data.accountType,
        countryCode: data.country,
        city: data.city?.trim(),
        institution: data.institution?.trim(),
        dateOfBirth,
        phoneNumber: phone || null,
        status: "PENDING_VERIFICATION",
        emailVerified: false,
        emailVerificationToken: otpHash,
        emailVerificationExpiry: expiry,
        emailOtpLastSentAt: now,
        metadata: { accountMode } as object,
      },
    });
    await tx.userAuth.create({
      data: { userId: u.id, passwordHash },
    });
    for (const c of walletCurrencies) {
      await createUserCurrencyAccountStack(tx, u.id, c);
    }
    return u;
  });

  recordOtpSend(email);

  await deliverRegistrationOtp(email, plainOtp);

  await publishDomainEvent("USER_REGISTERED", { userId: user.id, email: user.email });
  for (const c of walletCurrencies) {
    await publishDomainEvent("WALLET_CREATED", { userId: user.id, currency: c });
  }

  return { userId: user.id, email: user.email };
}

export async function verifyEmail(data: { email: string; code: string }): Promise<AuthTokens> {
  const email = normalizeEmail(data.email);
  const code = data.code.trim();
  const { prisma } = await import("../../infrastructure/database/index.js");

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      emailVerificationToken: true,
      emailVerificationExpiry: true,
    },
  });

  if (!user) throw userNotFoundError("User not found");
  if (user.emailVerified) throw validationError("Email already verified.");

  const acceptAny = emailOtpAcceptAny();
  if (acceptAny) {
    if (!/^\d{6}$/.test(code)) {
      throw validationError("Enter the 6-digit code.");
    }
  } else {
    if (!user.emailVerificationToken || !user.emailVerificationExpiry || user.emailVerificationExpiry < new Date()) {
      throw validationError("Invalid or expired verification code.");
    }

    const valid = await bcrypt.compare(code, user.emailVerificationToken);
    if (!valid) throw validationError("Invalid verification code.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      status: "ACTIVE",
      emailVerificationToken: null,
      emailVerificationExpiry: null,
      emailOtpLastSentAt: null,
    },
  });

  return generateTokens(user.id, user.email);
}

export async function resendEmailOtp(emailRaw: string): Promise<{ message: string }> {
  const email = normalizeEmail(emailRaw);
  assertHourlyOtpLimit(email);

  const { prisma } = await import("../../infrastructure/database/index.js");
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      emailVerified: true,
      status: true,
      emailOtpLastSentAt: true,
    },
  });

  if (!user) throw userNotFoundError("User not found");
  if (user.emailVerified || user.status !== "PENDING_VERIFICATION") {
    throw validationError("This account does not need email verification.");
  }

  const now = Date.now();
  if (user.emailOtpLastSentAt) {
    const waitMs = RESEND_COOLDOWN_MS - (now - user.emailOtpLastSentAt.getTime());
    if (waitMs > 0) {
      throw validationError(`Please wait ${Math.ceil(waitMs / 1000)}s before requesting another code.`);
    }
  }

  const plainOtp = generateOtp();
  const otpHash = await hashEmailOtp(plainOtp);
  const sentAt = new Date();
  const expiry = new Date(sentAt.getTime() + OTP_TTL_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: otpHash,
      emailVerificationExpiry: expiry,
      emailOtpLastSentAt: sentAt,
    },
  });

  recordOtpSend(email);
  await deliverRegistrationOtp(email, plainOtp);

  return { message: "Verification code sent to your email." };
}

export async function login(
  data: LoginInput,
  meta?: { ip?: string; userAgent?: string }
): Promise<AuthTokens> {
  const email = normalizeEmail(data.email);

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

  if (user.status === "PENDING_VERIFICATION") {
    logLoginAttempt({
      email,
      outcome: "EMAIL_NOT_VERIFIED",
      userId: user.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });
    throw authError("Please verify your email before signing in.");
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
  const auth = await (await import("../../infrastructure/database/index.js")).prisma.userAuth.findFirst({
    where: { refreshToken },
    select: { userId: true },
  });
  if (auth) {
    await authRepo.setRefreshToken(auth.userId, null);
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
