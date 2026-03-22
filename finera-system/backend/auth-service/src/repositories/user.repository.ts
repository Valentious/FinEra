/**
 * FinEra Auth - User Repository
 * Pure DB layer: lookup and updates only.
 * NEVER compares passwords here - that belongs in AuthService.
 * Primary key (id) = ONLY identity anchor. Email/phone = secondary keys for lookup.
 */

import { db } from '@finera/database';

export type UserAuthRow = {
  id: string;
  email: string;
  passwordHash: string;
  status: string;
  role: string;
  lockedUntil: Date | null;
};

const USER_AUTH_SELECT = {
  id: true,
  email: true,
  passwordHash: true,
  status: true,
  role: true,
  lockedUntil: true,
} as const;

/**
 * STEP 1 IDENTIFY: Fetch user by email (secondary key).
 * Returns null if not found - never query password in same step.
 */
export async function findUserByEmail(normalizedEmail: string): Promise<UserAuthRow | null> {
  const prisma = db.getClient();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: USER_AUTH_SELECT,
  });
  return user as UserAuthRow | null;
}

/**
 * Fetch user by primary key (id) for token refresh.
 */
export async function findUserById(
  userId: string
): Promise<{ id: string; email: string } | null> {
  const prisma = db.getClient();
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Update last login and reset failed attempts on success.
 */
export async function updateLastLogin(userId: string): Promise<void> {
  const prisma = db.getClient();
  await prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
      loginAttempts: 0,
      lockedUntil: null,
    },
  });
}

/**
 * Increment failed login attempts; lock account if threshold exceeded.
 */
export async function incrementFailedLogin(userId: string): Promise<void> {
  const prisma = db.getClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loginAttempts: true },
  });
  if (!user) return;

  const newAttempts = (user.loginAttempts ?? 0) + 1;
  const lockUntil =
    newAttempts >= MAX_LOGIN_ATTEMPTS
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
