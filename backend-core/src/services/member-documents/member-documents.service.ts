import type { AccountType, LoanProductType } from "@prisma/client";
import { prisma } from "../../infrastructure/database/index.js";
import { validationError } from "../../middlewares/errorHandler.js";
import { assertStopOrderAllowsSalaryLoan } from "../member-agreements/stop-order.service.js";

export async function getUserAccountType(userId: string): Promise<AccountType> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountType: true },
  });
  if (!u) throw validationError("User not found");
  return u.accountType;
}

export async function upsertDocumentContext(
  userId: string,
  loanProductType: LoanProductType
): Promise<void> {
  const accountType = await getUserAccountType(userId);
  const isSalary = loanProductType === "SALARY_BACKED";

  await prisma.memberDocument.upsert({
    where: { userId },
    create: {
      userId,
      accountType,
      loanProductType,
      consentStatus: isSalary ? "PENDING" : null,
      consentFilePath: null,
    },
    update: {
      accountType,
      loanProductType,
      ...(isSalary
        ? {}
        : {
            consentStatus: null,
            consentFilePath: null,
          }),
    },
  });
}

export async function assertDocumentsAllowLoanApplication(
  userId: string,
  loanProductType: LoanProductType
): Promise<void> {
  const md = await prisma.memberDocument.findUnique({ where: { userId } });
  const accountType = md?.accountType ?? (await getUserAccountType(userId));
  const primaryDocumentLabel =
    accountType === "STUDENT"
      ? "Previous Result-Slips"
      : accountType === "ALUMNI"
        ? "Collateral Documents"
        : "Member agreement";
  if (!md?.agreementFilePath) {
    throw validationError(`${primaryDocumentLabel} must be uploaded before applying for this loan.`, {
      fields: [{ field: "memberDocuments", error: `${primaryDocumentLabel} upload required` }],
    });
  }
  if (md.agreementStatus === "REJECTED") {
    throw validationError(`${primaryDocumentLabel} was rejected. Please upload corrected documents.`, {
      fields: [{ field: "memberDocuments", error: `${primaryDocumentLabel} rejected` }],
    });
  }

  if (loanProductType === "SALARY_BACKED") {
    await assertStopOrderAllowsSalaryLoan(userId);
    if (!md.consentFilePath) {
      throw validationError("Payroll consent form is required for salary-based loans.", {
        fields: [{ field: "memberDocuments", error: "Payroll consent required" }],
      });
    }
    if (md.consentStatus === "REJECTED") {
      throw validationError("Payroll consent was rejected. Please upload a corrected document.", {
        fields: [{ field: "memberDocuments", error: "Consent rejected" }],
      });
    }
    const emp = await prisma.employmentDetails.findUnique({ where: { userId } });
    if (!emp) {
      throw validationError("Employment details are required for salary-based loans.", {
        fields: [{ field: "employment", error: "Complete employment details" }],
      });
    }
  }
}

export function toPublicMemberDocument(md: {
  loanProductType: LoanProductType;
  agreementStatus: string;
  consentStatus: string | null;
  stopOrderStatus: string | null;
  agreementFilePath: string | null;
  consentFilePath: string | null;
  stopOrderFilePath: string | null;
  adminNotes: string | null;
  assetDocumentationNote: string | null;
  uploadedAt: Date;
  updatedAt: Date;
}) {
  return {
    loanProductType: md.loanProductType,
    agreementStatus: md.agreementStatus,
    consentStatus: md.consentStatus,
    stopOrderStatus: md.stopOrderStatus,
    hasAgreementUpload: Boolean(md.agreementFilePath),
    hasConsentUpload: Boolean(md.consentFilePath),
    hasStopOrderUpload: Boolean(md.stopOrderFilePath),
    adminNotes: md.adminNotes,
    assetDocumentationNote: md.assetDocumentationNote,
    uploadedAt: md.uploadedAt.toISOString(),
    updatedAt: md.updatedAt.toISOString(),
  };
}
