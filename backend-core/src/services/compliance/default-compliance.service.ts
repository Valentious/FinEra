/**
 * Flags members after repeated missed installments (per-loan delinquencyStage).
 * Does not perform payroll deduction - sets payrollEnforcementEligible and notifications only.
 */

import { prisma } from "../../infrastructure/database/index.js";
import { getConfig } from "../../config/index.js";
import { publishDomainEvent } from "../../infrastructure/messaging/event-bus.js";

export async function recordMissedInstallment(loanId: string): Promise<{ delinquencyStage: number; userId: string }> {
  const loan = await prisma.loan.update({
    where: { id: loanId },
    data: { delinquencyStage: { increment: 1 } },
    select: { id: true, userId: true, delinquencyStage: true, loanType: true },
  });
  await evaluateUserDefaultCompliance(loan.userId);
  await publishDomainEvent("REPAYMENT_MISSED", {
    loanId: loan.id,
    userId: loan.userId,
    delinquencyStage: loan.delinquencyStage,
    loanType: loan.loanType,
  });
  return { delinquencyStage: loan.delinquencyStage, userId: loan.userId };
}

export async function evaluateUserDefaultCompliance(userId: string): Promise<void> {
  const threshold = getConfig().MISSED_REPAYMENTS_FOR_DEFAULT;
  const activeLoans = await prisma.loan.findMany({
    where: { userId, status: "ACTIVE" },
    select: { delinquencyStage: true, loanType: true },
  });
  const maxStage = activeLoans.reduce((m, l) => Math.max(m, l.delinquencyStage), 0);
  const salaryBackedBreached = activeLoans.some(
    (l) => l.loanType === "SALARY_BACKED" && l.delinquencyStage >= threshold
  );

  const shouldFlag = maxStage >= threshold;
  const payrollEligible = shouldFlag && salaryBackedBreached;

  const existing = await prisma.memberDefaultCompliance.findUnique({ where: { userId } });
  const wasFlagged = existing?.defaultFlagged ?? false;

  await prisma.memberDefaultCompliance.upsert({
    where: { userId },
    create: {
      userId,
      consecutiveMissedRepayments: maxStage,
      defaultFlagged: shouldFlag,
      defaultFlaggedAt: shouldFlag ? new Date() : null,
      payrollEnforcementEligible: payrollEligible,
    },
    update: {
      consecutiveMissedRepayments: maxStage,
      defaultFlagged: shouldFlag,
      defaultFlaggedAt: shouldFlag && !wasFlagged ? new Date() : existing?.defaultFlaggedAt ?? null,
      payrollEnforcementEligible: payrollEligible,
    },
  });

  if (shouldFlag && !wasFlagged) {
    await notifyDefaultAndEmployer(userId, payrollEligible);
  }
}

async function notifyDefaultAndEmployer(userId: string, payrollEligible: boolean): Promise<void> {
  await prisma.notification.create({
    data: {
      userId,
      type: "DEFAULT_WARNING",
      priority: "HIGH",
      title: "Account flagged - repayment default",
      message:
        "Your account has been flagged due to repeated missed repayments. Please contact support and arrange payment immediately.",
      data: { payrollEnforcementEligible: payrollEligible } as object,
    },
  });

  if (!payrollEligible) return;

  const employment = await prisma.employmentDetails.findUnique({ where: { userId } });
  const employerContact = employment?.employerContact?.trim() || "on file";

  await prisma.notification.create({
    data: {
      userId,
      type: "SYSTEM_ALERT",
      priority: "URGENT",
      title: "Employer notification (compliance)",
      message: `Per payroll-linked loan terms, your employer may be notified at ${employerContact} for recovery coordination. No automatic deduction is performed by FinEra.`,
      data: {
        kind: "employer_compliance",
        employerContact: employment?.employerContact ?? null,
        note: "Route to collections for manual employer outreach.",
      } as object,
    },
  });

  await prisma.memberDefaultCompliance.update({
    where: { userId },
    data: { employerNotifiedAt: new Date() },
  });
}

export async function recomputeComplianceForUserLoans(userId: string): Promise<void> {
  await evaluateUserDefaultCompliance(userId);
}
