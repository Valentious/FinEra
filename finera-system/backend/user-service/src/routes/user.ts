/**
 * FinEra User Service - Profile management
 * POST /profile (orchestration), GET /profile/:userId
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { db } from '@finera/database';

export const userRoutes = Router();

const profileSchema = z.object({
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  userType: z.enum(['STUDENT', 'STAFF', 'ALUMNI']),
  phoneNumber: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

userRoutes.post('/profile', async (req: Request, res: Response) => {
  try {
    const validatedData = profileSchema.parse(req.body);
    const prisma = db.getClient();

    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found in system' });
    }

    const learningProfile = await prisma.learningProfile.upsert({
      where: { userId: validatedData.userId },
      update: { userType: validatedData.userType },
      create: {
        userId: validatedData.userId,
        userType: validatedData.userType,
        financialDisciplineScore: 0,
        learningStreakDays: 0,
        totalTimeSpentSeconds: 0,
        modulesCompleted: 0,
        averageQuizScore: 0,
        notificationPreferences: { email: true, push: true, sms: false },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        profileId: learningProfile.id,
        userId: validatedData.userId,
        userType: validatedData.userType,
        createdAt: learningProfile.createdAt,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: err.errors });
    }
    console.error('Profile creation error:', err);
    res.status(500).json({ success: false, error: 'Profile creation failed' });
  }
});

userRoutes.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const profile = await db.getClient().learningProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true, role: true, status: true },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    res.json({ success: true, data: profile });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});
