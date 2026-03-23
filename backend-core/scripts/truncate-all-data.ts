/**
 * FinEra - Truncate All Data
 * Removes all records from the database while preserving schema.
 * Run: npx tsx scripts/truncate-all-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Tables in dependency order (children first) for TRUNCATE CASCADE
  const tables = [
    "Repayment",
    "Transaction",
    "Loan",
    "Wallet",
    "CreditProfile",
    "KycDocument",
    "FraudLog",
    "Notification",
    "AuditLog",
    "UserAuth",
    "User",
    "RefreshTokenBlacklist",
  ];

  const quoted = tables.map((t) => `"${t}"`).join(", ");
  const sql = `TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`;

  await prisma.$executeRawUnsafe(sql);
  console.log("✅ All FinEra data truncated successfully.");
  console.log("   Database is empty and ready for new registrations.");
}

main()
  .catch((e) => {
    console.error("❌ Truncate failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
