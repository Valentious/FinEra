/**
 * FinEra - Auth Repository
 * Database layer: user lookup and credential updates.
 * NEVER compares passwords here - that belongs in the service.
 * User = identity. UserAuth = credentials. Proper normalization (3NF).
 */

import { prisma } from "../../infrastructure/database/index.js";
import type { UserStatus } from "@prisma/client";

/** Result: User + UserAuth for login. Identity + Credentials joined. */
export type UserAuthRow = {
  id: string;
  email: string;
  status: UserStatus;
  passwordHash: string;
  lockedUntil: Date | null;
};

/**
 * STEP 1: Fetch user by email, include auth credentials (UserAuth).
 * Returns null if not found - NEVER query password in same step.
 */
export async function findUserByEmail(normalizedEmail: string): Promise<UserAuthRow | null> {
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      status: true,
      authCredentials: {
        select: { passwordHash: true, lockedUntil: true },
      },
    },
  });
  if (!user || !user.authCredentials) return null;
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    passwordHash: user.authCredentials.passwordHash,
    lockedUntil: user.authCredentials.lockedUntil,
  };
}

/**
 * Fetch user + auth by primary key for token refresh.
 */
export async function findUserById(userId: string): Promise<{
  id: string;
  email: string;
  refreshToken: string | null;
} | null> {
  const auth = await prisma.userAuth.findUnique({
    where: { userId },
    select: { user: { select: { id: true, email: true } }, refreshToken: true },
  });
  if (!auth) return null;
  return {
    id: auth.user.id,
    email: auth.user.email,
    refreshToken: auth.refreshToken,
  };
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Update last login and reset failed attempts on success (UserAuth).
 */
export async function updateLastLogin(userId: string, ip?: string): Promise<void> {
  await prisma.userAuth.update({
    where: { userId },
    data: {
      lastLoginAt: new Date(),
      lastLoginIP: ip ?? null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
}

/**
 * Increment failed login attempts; lock account if threshold exceeded (UserAuth).
 */
export async function incrementFailedLogin(userId: string): Promise<void> {
  const auth = await prisma.userAuth.findUnique({
    where: { userId },
    select: { failedLoginAttempts: true },
  });
  if (!auth) return;

  const newAttempts = (auth.failedLoginAttempts ?? 0) + 1;
  const lockUntil =
    newAttempts >= MAX_LOGIN_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
      : null;

  await prisma.userAuth.update({
    where: { userId },
    data: { failedLoginAttempts: newAttempts, lockedUntil: lockUntil },
  });
}

/**
 * Store refresh token in UserAuth.
 */
export async function setRefreshToken(userId: string, token: string | null, expiresAt?: Date): Promise<void> {
  await prisma.userAuth.update({
    where: { userId },
    data: { refreshToken: token, refreshTokenExpiry: expiresAt ?? null },
  });
}
