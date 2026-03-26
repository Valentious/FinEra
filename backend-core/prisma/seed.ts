/**
 * FinEra Backend - Database Seed
 * Creates test user, wallets, and learning hub content
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { FINANCIAL_TERMS, LEARNING_MODULES } from "../src/modules/learning/learning.data";

const prisma = new PrismaClient();

async function seedLearningHub() {
  for (const t of FINANCIAL_TERMS) {
    await prisma.financialTerm.upsert({
      where: { slug: t.slug },
      update: {
        simpleDefinition: t.simpleDefinition,
        advancedDefinition: t.advancedDefinition,
        example: t.example,
        relatedTerms: t.relatedTerms,
      },
      create: {
        term: t.term,
        slug: t.slug,
        simpleDefinition: t.simpleDefinition,
        advancedDefinition: t.advancedDefinition,
        example: t.example,
        relatedTerms: t.relatedTerms,
      },
    });
  }
  for (const m of LEARNING_MODULES) {
    await prisma.learningModule.upsert({
      where: { slug: m.slug },
      update: {
        moduleCode: m.moduleCode,
        title: m.title,
        description: m.description,
        difficultyLevel: m.difficultyLevel,
        category: m.category,
        estimatedDurationMinutes: m.durationMinutes,
        durationMinutes: m.durationMinutes,
        prerequisites: m.prerequisites ?? [],
        content: m.content ?? undefined,
        tier: m.tier,
        orderIndex: m.orderIndex,
        icon: m.icon,
        color: m.color,
        termsIncluded: m.termsIncluded,
        isActive: true,
      },
      create: {
        moduleCode: m.moduleCode,
        title: m.title,
        slug: m.slug,
        description: m.description,
        difficultyLevel: m.difficultyLevel,
        category: m.category,
        estimatedDurationMinutes: m.durationMinutes,
        durationMinutes: m.durationMinutes,
        prerequisites: m.prerequisites ?? [],
        content: m.content ?? undefined,
        tier: m.tier,
        orderIndex: m.orderIndex,
        icon: m.icon,
        color: m.color,
        termsIncluded: m.termsIncluded,
        status: "PUBLISHED",
        isActive: true,
      },
    });
  }
  console.log("Learning Hub: terms and modules seeded");
}

async function main() {
  const hash = await bcrypt.hash("TestPassword123!", 12);

  const user = await prisma.user.upsert({
    where: { email: "test@university.edu" },
    update: {},
    create: {
      email: "test@university.edu",
      fullName: "Test User",
      accountType: "STUDENT",
      accountTier: "TIER_2",
      countryCode: "ZWE",
      city: "Harare",
      institution: "University of Zimbabwe",
      passwordHash: hash,
      emailVerified: true,
      status: "ACTIVE",
    },
  });

  const currencies = ["USD", "ZIG", "ZAR"] as const;
  const existing = await prisma.wallet.findMany({ where: { userId: user.id } });
  const existingCurrencies = new Set(existing.map((w) => w.currencyCode));
  for (const currency of currencies) {
    if (existingCurrencies.has(currency)) continue;
    const accountNumber = `FIN${Date.now().toString().slice(-8)}${Math.random().toString().slice(2, 6)}`;
    await prisma.wallet.create({
      data: {
        userId: user.id,
        currencyCode: currency,
        accountNumber,
      },
    });
  }

  const REGISTRY = [
    { currencyCode: "USD" as const, displayName: "US Dollar", symbol: "$", custodyType: "bank", dashboardConfig: { minAmount: 1, maxAmount: 999999, feePercent: 0.1, dailyLimit: 50000, features: ["international", "strict_compliance"] } },
    { currencyCode: "ZIG" as const, displayName: "Zimbabwe Gold (ZiG)", symbol: "Z$", custodyType: "momo", dashboardConfig: { minAmount: 10, maxAmount: 999999999, feePercent: 0.5, dailyLimit: 50000000, features: ["local_transfers"] } },
    { currencyCode: "ZAR" as const, displayName: "South African Rand", symbol: "R", custodyType: "bank", dashboardConfig: { minAmount: 5, maxAmount: 999999, feePercent: 0.2, dailyLimit: 100000, features: ["regional_transfers"] } },
    { currencyCode: "EUR" as const, displayName: "Euro", symbol: "€", custodyType: "bank", dashboardConfig: { minAmount: 1, maxAmount: 999999, feePercent: 0.2, dailyLimit: 50000, features: ["international"] } },
    { currencyCode: "GBP" as const, displayName: "British Pound", symbol: "£", custodyType: "bank", dashboardConfig: { minAmount: 1, maxAmount: 999999, feePercent: 0.2, dailyLimit: 50000, features: ["international"] } },
  ];
  for (const r of REGISTRY) {
    try {
      await prisma.currencyRegistry.upsert({
        where: { currencyCode: r.currencyCode },
        update: { displayName: r.displayName, symbol: r.symbol, custodyType: r.custodyType, dashboardConfig: r.dashboardConfig as object },
        create: { currencyCode: r.currencyCode, displayName: r.displayName, symbol: r.symbol, custodyType: r.custodyType, dashboardConfig: r.dashboardConfig as object },
      });
    } catch {
      /* table may not exist yet */
    }
  }

  await seedLearningHub();
  console.log("Seed complete:", user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
