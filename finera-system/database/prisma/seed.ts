/**
 * FinEra Database Seed
 * Default learning modules, admin user, wallet
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const modules = [
    {
      code: 'FIN-101',
      title: 'Introduction to Financial Literacy',
      description: 'Learn the basics of personal finance and money management',
      difficultyLevel: 1,
      category: 'BASICS',
      estimatedDuration: 30,
      content: {
        sections: [
          {
            title: 'Understanding Credit',
            text: 'Credit is a crucial concept in personal finance...',
            terms: ['credit score', 'interest rate', 'principal'],
          },
          {
            title: 'Budgeting Basics',
            text: 'A budget helps you track income and expenses...',
            terms: ['income', 'expenses', 'savings'],
          },
        ],
      },
      tags: ['basics', 'credit', 'budgeting'],
      isActive: true,
    },
    {
      code: 'FIN-201',
      title: 'Advanced Credit Management',
      description: 'Deep dive into credit scores, reports, and improvement strategies',
      difficultyLevel: 3,
      category: 'CREDIT',
      estimatedDuration: 45,
      content: {
        sections: [
          {
            title: 'Credit Score Components',
            text: 'Your credit score is calculated based on five key factors...',
            terms: ['payment history', 'credit utilization', 'credit mix'],
          },
        ],
      },
      tags: ['credit', 'advanced', 'scoring'],
      prerequisites: ['FIN-101'],
      isActive: true,
    },
  ];

  for (const mod of modules) {
    await prisma.learningModule.upsert({
      where: { code: mod.code },
      update: {
        title: mod.title,
        description: mod.description,
        difficultyLevel: mod.difficultyLevel,
        category: mod.category,
        estimatedDuration: mod.estimatedDuration,
        content: mod.content,
        tags: mod.tags,
        prerequisites: mod.code === 'FIN-201' ? ['FIN-101'] : undefined,
        isActive: mod.isActive,
      },
      create: {
        code: mod.code,
        title: mod.title,
        description: mod.description,
        difficultyLevel: mod.difficultyLevel,
        category: mod.category,
        estimatedDuration: mod.estimatedDuration,
        content: mod.content,
        tags: mod.tags,
        prerequisites: mod.code === 'FIN-201' ? ['FIN-101'] : undefined,
        isActive: mod.isActive,
      },
    });
  }

  const adminPassword = await bcrypt.hash('Admin@123456', 10);
  const nextCalc = new Date();
  nextCalc.setDate(nextCalc.getDate() + 30);

  const admin = await prisma.$transaction(async (tx) => {
    const u = await tx.user.upsert({
      where: { email: 'admin@finera.com' },
      update: {},
      create: {
        email: 'admin@finera.com',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: new Date(),
        learningProfile: {
          create: {
            userType: 'STAFF',
            financialDisciplineScore: 100,
            learningStreakDays: 0,
          },
        },
      },
    });
    await tx.userAuth.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id, passwordHash: adminPassword },
    });
    return u;
  });

  await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      balance: 0,
      status: 'ACTIVE',
    },
  });

  await prisma.creditScore.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      overallScore: 100,
      disciplineScore: 100,
      riskLevel: 'EXCELLENT',
      nextCalculation: nextCalc,
    },
  });

  console.log('✅ Seeding completed');
  console.log('Created admin user:', admin.email);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
