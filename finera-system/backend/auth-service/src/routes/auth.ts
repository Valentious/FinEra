/**
 * FinEra Auth Service - Registration & Login
 * Identity vs Credential: 2-step login (identify by email, authenticate with bcrypt).
 * Registration orchestrates: user profile, wallet, credit score, admin audit.
 */

import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { login, normalizeEmail } from '../services/auth.service.js';
import { z } from 'zod';
import { db } from '@finera/database';
import { serviceClient } from '../lib/http-client.js';
import { eventBus, EventType } from '@finera/shared/events';

export const authRoutes = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change-in-production';
const SALT_ROUNDS = 12;

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  userType: z.enum(['STUDENT', 'STAFF', 'ALUMNI']).default('STUDENT'),
  phoneNumber: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

authRoutes.post('/register', async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const prisma = db.getClient();
    const email = normalizeEmail(validatedData.email);

    // IDENTIFY: Check if email already exists (secondary key lookup)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'User already exists' },
      });
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, SALT_ROUNDS);

    const user = await db.transaction(async (tx) => {
      return tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phoneNumber: validatedData.phoneNumber,
          role: validatedData.userType,
          status: 'ACTIVE',
        },
      });
    });

    const serviceResults = await orchestrateRegistration(user.id, validatedData, req);

    // Publish USER_REGISTERED event (async, non-blocking) for event-driven consumers
    eventBus
      .publish('user.events', 'user.registered', {
        type: EventType.USER_REGISTERED,
        version: 1,
        source: 'auth-service',
        data: {
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          userType: validatedData.userType,
          timestamp: new Date().toISOString(),
        },
        metadata: {
          correlationId: req.headers['x-correlation-id'] as string | undefined,
          userId: user.id,
        },
      })
      .catch((err) => console.error('[Auth] Failed to publish user.registered:', err));

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: 86400 }
    );

    const walletData = (serviceResults.wallet as { data?: { data?: { walletId?: string } } })?.data?.data;
    const creditData = (serviceResults.credit as { data?: { data?: { score?: number } } })?.data?.data;

    res.status(201).json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        token,
        role: user.role,
        walletId: walletData?.walletId,
        creditScore: creditData?.score,
        services: serviceResults,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: err.errors,
      });
    }
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined,
    });
  }
});

async function orchestrateRegistration(
  userId: string,
  userData: z.infer<typeof registerSchema>,
  req: Request
) {
  const results: Record<string, unknown> = {
    user: null,
    wallet: null,
    credit: null,
    admin: null,
  };

  const [userResult, walletResult, creditResult, adminResult] = await Promise.allSettled([
    createUserProfile(userId, userData),
    createWallet(userId),
    initializeCreditScore(userId, userData),
    logAdminActivity(userId, userData, req),
  ]);

  if (userResult.status === 'fulfilled') results.user = userResult.value;
  else {
    console.error('User profile creation failed:', userResult.reason);
    results.user = { success: false, error: (userResult.reason as Error).message };
  }

  if (walletResult.status === 'fulfilled') results.wallet = walletResult.value;
  else {
    console.error('Wallet creation failed:', walletResult.reason);
    results.wallet = { success: false, error: (walletResult.reason as Error).message };
    await compensateFailedRegistration(userId, 'wallet_creation_failed');
  }

  if (creditResult.status === 'fulfilled') results.credit = creditResult.value;
  else {
    console.error('Credit score initialization failed:', creditResult.reason);
    results.credit = { success: false, error: (creditResult.reason as Error).message };
  }

  if (adminResult.status === 'fulfilled') results.admin = adminResult.value;
  else {
    console.error('Admin logging failed:', adminResult.reason);
    results.admin = { success: false, error: (adminResult.reason as Error).message };
  }

  return results;
}

async function createUserProfile(userId: string, userData: z.infer<typeof registerSchema>) {
  return serviceClient.callWithRetry(
    'user',
    '/api/v1/users/profile',
    'POST',
    {
      userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      userType: userData.userType,
      phoneNumber: userData.phoneNumber,
      metadata: userData.metadata,
    },
    3
  );
}

async function createWallet(userId: string) {
  return serviceClient.callWithRetry(
    'ledger',
    '/api/v1/ledger/wallets',
    'POST',
    {
      userId,
      currency: 'USD',
      initialBalance: 0,
      metadata: { createdVia: 'registration', timestamp: new Date().toISOString() },
    },
    5
  );
}

async function initializeCreditScore(userId: string, userData: z.infer<typeof registerSchema>) {
  return serviceClient.callWithRetry(
    'credit',
    '/api/v1/credit/initialize',
    'POST',
    {
      userId,
      userType: userData.userType,
      initialScore: 60,
      metadata: { registrationDate: new Date().toISOString() },
    },
    3
  );
}

async function logAdminActivity(
  userId: string,
  userData: z.infer<typeof registerSchema>,
  req: Request
) {
  return serviceClient.callWithRetry(
    'admin',
    '/api/v1/admin/audit',
    'POST',
    {
      userId,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: userId,
      metadata: {
        email: userData.email,
        userType: userData.userType,
        timestamp: new Date().toISOString(),
        ipAddress: req.ip ?? req.socket?.remoteAddress,
      },
    },
    2
  );
}

async function compensateFailedRegistration(userId: string, reason: string) {
  console.error(`Compensation triggered for user ${userId}: ${reason}`);
  const prisma = db.getClient();
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'REGISTRATION_COMPENSATION',
      entityType: 'User',
      entityId: userId,
      newValues: {
        compensationReason: reason,
        timestamp: new Date().toISOString(),
        requiresManualReview: true,
      },
    },
  });
}

authRoutes.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password required' },
      });
    }

    const result = await login(email, password);

    if (!result.success) {
      const status =
        result.error.code === 'USER_NOT_FOUND'
          ? 404
          : result.error.code === 'ACCOUNT_LOCKED'
            ? 423
            : result.error.code === 'ACCOUNT_INACTIVE'
              ? 403
              : 401;
      return res.status(status).json(result);
    }

    res.json({
      success: true,
      data: { userId: result.userId, token: result.token, role: result.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Login failed' },
    });
  }
});

authRoutes.get('/me', (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(auth.substring(7), JWT_SECRET) as { userId: string; role: string };
    res.json({ userId: decoded.userId, role: decoded.role });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});
