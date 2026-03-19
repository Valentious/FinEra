/**
 * FinEra Backend - Database Seed
 * Creates test user and wallets
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
const prisma = new PrismaClient();
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
    const currencies = ["USD", "ZIG", "ZAR"];
    const existing = await prisma.wallet.findMany({ where: { userId: user.id } });
    const existingCurrencies = new Set(existing.map((w) => w.currencyCode));
    for (const currency of currencies) {
        if (existingCurrencies.has(currency))
            continue;
        const accountNumber = `FIN${Date.now().toString().slice(-8)}${Math.random().toString().slice(2, 6)}`;
        await prisma.wallet.create({
            data: {
                userId: user.id,
                currencyCode: currency,
                accountNumber,
            },
        });
    }
    console.log("Seed complete:", user.email);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map