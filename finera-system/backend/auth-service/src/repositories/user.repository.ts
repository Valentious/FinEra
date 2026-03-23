/**
 * FinEra Auth - User Repository
 * Pure DB layer: lookup and updates only.
 * User = identity. UserAuth = credentials. Proper normalization (3NF).
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

/**
 * STEP 1 IDENTIFY: Fetch user by email, include UserAuth credentials.
 * Returns null if not found - never query password in same step.
 */
export async function findUserByEmail(normalizedEmail: string): Promise<UserAuthRow | null> {
  const prisma = db.getClient();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      status: true,
      role: true,
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
    role: user.role,
    passwordHash: user.authCredentials.passwordHash,
    lockedUntil: user.authCredentials.lockedUntil,
  };
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
 * Update last login and reset failed attempts on success (UserAuth).
 */
export async function updateLastLogin(userId: string): Promise<void> {
  const prisma = db.getClient();
  await prisma.userAuth.update({
    where: { userId },
    data: {
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
}

/**
 * Increment failed login attempts; lock account if threshold exceeded (UserAuth).
 */
export async function incrementFailedLogin(userId: string): Promise<void> {
  const prisma = db.getClient();
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
