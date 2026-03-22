/**
 * FinEra - Auth Repository
 * Database layer: user lookup and updates.
 * NEVER compares passwords here - that belongs in the service.
 * Primary key (user_id/id) is the ONLY identity anchor.
 * Email and phone are UNIQUE secondary keys for lookup only.
 */

import { prisma } from "../../infrastructure/database/index.js";
import type { UserStatus } from "@prisma/client";

/** Fields needed for auth validation - excludes sensitive data from general selects */
const USER_AUTH_SELECT = {
  id: true,
  email: true,
  passwordHash: true,
  status: true,
  lockedUntil: true,
} as const;

/** Result type - password_hash belongs to USER (user_id), not email */
export type UserAuthRow = {
  id: string;
  email: string;
  passwordHash: string;
  status: UserStatus;
  lockedUntil: Date | null;
};

/**
 * STEP 1: Fetch user by email (secondary key).
 * Returns null if not found - NEVER query password in same step.
 */
export async function findUserByEmail(normalizedEmail: string): Promise<UserAuthRow | null> {
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: USER_AUTH_SELECT,
  });
  return user;
}

/**
 * Fetch user by primary key (user_id) for token refresh / session validation.
 */
export async function findUserById(userId: string): Promise<{ id: string; email: string; refreshToken: string | null } | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, refreshToken: true },
  });
}

/** Max failed attempts before lockout */
const MAX_LOGIN_ATTEMPTS = 5;
/** Lockout duration in minutes */
const LOCKOUT_MINUTES = 15;

/**
 * Update last login and reset failed attempts on success.
 */
export async function updateLastLogin(userId: string, ip?: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
      lastLoginIP: ip ?? null,
      loginAttempts: 0,
      lockedUntil: null,
    },
  });
}

/**
 * Increment failed login attempts; lock account if threshold exceeded.
 */
export async function incrementFailedLogin(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loginAttempts: true },
  });
  if (!user) return;

  const newAttempts = (user.loginAttempts ?? 0) + 1;
  const lockUntil = newAttempts >= MAX_LOGIN_ATTEMPTS
    ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
    : null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      loginAttempts: newAttempts,
      lockedUntil: lockUntil,
    },
  });
}

/**
 * Store refresh token for session management.
 */
export async function setRefreshToken(userId: string, token: string | null, expiresAt?: Date): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: token, refreshTokenExpiry: expiresAt ?? null },
  });
}
