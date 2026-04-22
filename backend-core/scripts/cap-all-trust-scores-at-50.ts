/**
 * One-shot: set every CreditProfile with financialDisciplineScore > 50 down to 50,
 * recalc creditLimit / availableCredit / riskLevel (Dynamic Credit Engine rules).
 * Also caps UserLearningProfile.financialDisciplineScore > 50 → 50.
 *
 * Run from backend-core:  npm run db:cap-trust-50
 * Requires DATABASE_URL (see .env / .env.example).
 */

import "dotenv/config";
import { prisma } from "../src/infrastructure/database/index.js";
import { creditLimitForTrustScore } from "../src/services/credit-engine/domain/dynamic-credit-engine.js";
import { prismaRiskFromTrust, sumActiveLoanBalances } from "../src/services/credit-engine/domain/trust-score.service.js";

const TARGET = 50;

async function main() {
  const profiles = await prisma.creditProfile.findMany({
    where: { financialDisciplineScore: { gt: TARGET } },
    include: { user: { select: { accountType: true, email: true } } },
  });

  let creditUpdated = 0;
  for (const p of profiles) {
    const accountType = p.user?.accountType;
    const limit = creditLimitForTrustScore(TARGET, accountType);
    const outstanding = await sumActiveLoanBalances(p.userId);

    await prisma.creditProfile.update({
      where: { userId: p.userId },
      data: {
        previousScore: p.financialDisciplineScore,
        financialDisciplineScore: TARGET,
        repaymentReliability: TARGET,
        savingsConsistency: TARGET,
        transactionHealth: TARGET,
        riskLevel: prismaRiskFromTrust(TARGET),
        creditLimit: limit,
        availableCredit: Math.max(0, limit - outstanding),
        lastScoreUpdate: new Date(),
      },
    });
    creditUpdated += 1;
    console.log(
      `CreditProfile: ${p.user?.email ?? p.userId} ${p.financialDisciplineScore} → ${TARGET} (limit ${limit}, available ${Math.max(0, limit - outstanding)})`
    );
  }

  const learning = await prisma.userLearningProfile.updateMany({
    where: { financialDisciplineScore: { gt: TARGET } },
    data: { financialDisciplineScore: TARGET },
  });

  console.log(`\nDone. CreditProfile rows capped: ${creditUpdated}. UserLearningProfile rows updated: ${learning.count}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
