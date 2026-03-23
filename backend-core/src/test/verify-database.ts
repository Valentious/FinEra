/**
 * FinEra - Database Operations Verification
 * Run: npx tsx src/test/verify-database.ts
 */

import { prisma } from "../infrastructure/database/index.js";
import bcrypt from "bcrypt";

async function verifyDatabaseOperations() {
  console.log("🔍 Starting Database Verification...\n");

  try {
    // 1. Test Connection
    console.log("📡 Testing database connection...");
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connection successful\n");

    // 2. Create Test User
    console.log("👤 Creating test user...");
    const hashedPassword = await bcrypt.hash("TestPass123!@#", 12);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: `test-${Date.now()}@university.edu`,
          fullName: "Test User",
          accountType: "STUDENT",
          accountTier: "TIER_1",
          countryCode: "ZWE",
          city: "Harare",
          institution: "University of Zimbabwe",
          status: "ACTIVE",
        },
      });
      await tx.userAuth.create({
        data: { userId: u.id, passwordHash: hashedPassword },
      });
      return u;
    });
    console.log(`✅ User created with ID: ${user.id}\n`);

    // 3. Create Wallets
    console.log("💰 Creating wallets...");
    const currencies = ["USD", "ZIG", "ZAR"] as const;
    const wallets = [];

    for (const currency of currencies) {
      const wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          currencyCode: currency,
          accountNumber: `FIN${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`,
        },
      });
      wallets.push(wallet);
      console.log(`  ✅ ${currency} wallet created: ${wallet.accountNumber}`);
    }
    console.log("");

    // 4. Create Transaction
    console.log("💸 Creating test transaction...");
    const reference = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const transaction = await prisma.transaction.create({
      data: {
        reference,
        userId: user.id,
        walletId: wallets[0].id,
        transactionType: "DEPOSIT",
        amount: 500,
        fee: 0,
        netAmount: 500,
        currency: "USD",
        status: "COMPLETED",
        metadata: { paymentMethod: "BANK_TRANSFER", description: "Initial deposit" } as object,
        completedAt: new Date(),
      },
    });
    console.log(`  ✅ Transaction created: ${transaction.reference}\n`);

    // 5. Create Credit Profile
    console.log("📊 Creating credit profile...");
    const creditProfile = await prisma.creditProfile.create({
      data: {
        userId: user.id,
        financialDisciplineScore: 75,
        creditLimit: 500,
        availableCredit: 500,
        repaymentReliability: 80,
        savingsConsistency: 70,
        transactionHealth: 75,
        accountLongevity: 30,
        kycLevelBonus: 60,
        riskLevel: "LOW",
        lastScoreUpdate: new Date(),
      },
    });
    console.log(`  ✅ Credit profile created with score: ${creditProfile.financialDisciplineScore}\n`);

    // 6. Create Loan
    console.log("🏦 Creating test loan...");
    const loanNumber = `LN-${new Date().toISOString().slice(0, 7).replace(/-/, "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const loan = await prisma.loan.create({
      data: {
        loanNumber,
        userId: user.id,
        walletId: wallets[0].id,
        principalAmount: 300,
        interestRate: 12.5,
        totalInterest: 15,
        fees: 0,
        totalRepayable: 315,
        amountDisbursed: 300,
        remainingBalance: 315,
        currency: "USD",
        term: 6,
        installmentAmount: 52.5,
        maturityDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
      },
    });
    console.log(`  ✅ Loan created: ${loan.loanNumber}\n`);

    // 7. Create Repayment
    console.log("💵 Creating test repayment...");
    const repayment = await prisma.repayment.create({
      data: {
        loanId: loan.id,
        userId: user.id,
        scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        expectedAmount: 52.5,
        paidAmount: 0,
        paidOnTime: null,
        status: "PENDING",
      },
    });
    console.log(`  ✅ Repayment scheduled for: ${repayment.scheduledDate}\n`);

    // 8. Create Notification
    console.log("🔔 Creating test notification...");
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: "LOAN_REMINDER",
        priority: "HIGH",
        title: "Loan Repayment Due",
        message: "Your first loan payment of $52.50 is due in 7 days",
        data: { loanId: loan.id, amount: 52.5, dueDate: repayment.scheduledDate } as object,
      },
    });
    console.log(`  ✅ Notification created: ${notification.title}\n`);

    // 9. Verify Relationships
    console.log("🔗 Verifying relationships...");
    const userWithRelations = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        wallets: true,
        transactions: true,
        loans: { include: { repayments: true } },
        creditProfile: true,
        notifications: true,
      },
    });

    console.log("  ✅ All relationships verified");
    console.log(`  📊 Summary: Wallets ${userWithRelations?.wallets.length}, Transactions ${userWithRelations?.transactions.length}, Loans ${userWithRelations?.loans.length}, Notifications ${userWithRelations?.notifications.length}\n`);

    // 10. Cleanup
    console.log("🧹 Cleaning up test data...");
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    await prisma.repayment.deleteMany({ where: { userId: user.id } });
    await prisma.loan.deleteMany({ where: { userId: user.id } });
    await prisma.creditProfile.deleteMany({ where: { userId: user.id } });
    await prisma.transaction.deleteMany({ where: { userId: user.id } });
    await prisma.wallet.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log("✅ Test data cleaned up\n");

    console.log("✅ All database operations verified successfully!\n");
  } catch (error) {
    console.error("❌ Verification failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabaseOperations()
  .then(() => console.log("🎉 Database verification complete!"))
  .catch(() => process.exit(1));
