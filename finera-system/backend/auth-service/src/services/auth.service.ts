/**
 * FinEra Auth Service - Business Logic
 *
 * Identity vs Credential separation:
 * - user_id (id) = PRIMARY KEY, identity anchor
 * - email = UNIQUE secondary key (lookup only)
 * - password_hash = belongs to USER, never to email
 * - Login: STEP 1 identify by email, STEP 2 authenticate with bcrypt (never together)
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as userRepo from '../repositories/user.repository.js';

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'change-in-production';

/** Normalize email: lowercase, trim. Enforced before any DB operation. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type AuthError = {
  success: false;
  error: { code: string; message: string };
};

export function authError(code: string, message: string): AuthError {
  return { success: false, error: { code, message } };
}

export type LoginResult =
  | { success: true; userId: string; email: string; role: string; token: string }
  | AuthError;

/**
 * Login: STRICT 2-step flow.
 * STEP 1: Identify - fetch user by email. 404 if not found.
 * STEP 2: Authenticate - bcrypt.compare. 401 if mismatch.
 * Pre-validation: status, lockout.
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResult> {
  const normalized = normalizeEmail(email);

  // STEP 1: IDENTIFY - fetch by email only
  const user = await userRepo.findUserByEmail(normalized);

  if (!user) {
    return authError('USER_NOT_FOUND', 'User not found');
  }

  // Pre-validation: account status
  if (user.status !== 'ACTIVE') {
    return authError(
      'ACCOUNT_INACTIVE',
      'Account is not active'
    );
  }

  // Pre-validation: lockout (before CPU-heavy bcrypt)
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return authError(
      'ACCOUNT_LOCKED',
      'Account temporarily locked due to too many failed attempts'
    );
  }

  // STEP 2: AUTHENTICATE - compare password hash
  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    await userRepo.incrementFailedLogin(user.id);
    return authError('INVALID_PASSWORD', 'Incorrect password');
  }

  await userRepo.updateLastLogin(user.id);

  const token = jwt.sign(
    { sub: user.id, userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: 86400 }
  );

  return {
    success: true,
    userId: user.id,
    email: user.email,
    role: user.role,
    token,
  };
}
