/**
 * FinEra Backend - Authentication Service
 */

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../infrastructure/database/index.js";
import { getConfig } from "../../config/index.js";
import type { AccountType } from "@prisma/client";
import { conflictError, authError } from "../../middlewares/errorHandler.js";
import type { JwtPayload } from "../../types/index.js";

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

export async function register(data: RegisterInput): Promise<{ userId: string; email: string }> {
  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) throw conflictError("Email already registered");

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      fullName: data.fullName,
      accountType: data.accountType,
      countryCode: data.country,
      city: data.city,
      institution: data.institution,
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

export async function login(data: LoginInput): Promise<AuthTokens> {
  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (!user || user.status !== "ACTIVE") throw authError("Invalid credentials");

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw authError("Invalid credentials");

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return generateTokens(user.id, user.email);
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const config = getConfig();

  const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as JwtPayload;
  if (decoded.type !== "refresh") throw authError("Invalid refresh token");

  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
  });

  if (!user || user.refreshToken !== refreshToken) throw authError("Invalid refresh token");

  return generateTokens(user.id, user.email);
}

export async function logout(refreshToken: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { refreshToken },
  });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: null },
    });
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
