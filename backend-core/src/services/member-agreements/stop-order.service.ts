import path from "node:path";
import fs from "node:fs";
import type { MemberAgreementDocumentStatus, MemberAgreementDocumentType } from "@prisma/client";
import { prisma } from "../../infrastructure/database/index.js";
import { validationError } from "../../middlewares/errorHandler.js";
import { getUserAccountType } from "../member-documents/member-documents.service.js";

export const STOP_ORDER_DOCUMENT_TYPE = "LOAN_REPAYMENT_STOP_ORDER" as MemberAgreementDocumentType;
export const STOP_ORDER_STORAGE_DIR = path.join("uploads", "member-agreements", "stop-orders");

export type PublicStopOrderStatus = "pending" | "submitted" | "approved" | "rejected";

function toPublicStatus(status: MemberAgreementDocumentStatus): PublicStopOrderStatus {
  switch (status) {
    case "SUBMITTED":
      return "submitted";
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    default:
      return "pending";
  }
}

export function toPublicStopOrderDocument(row: {
  documentType: MemberAgreementDocumentType;
  status: MemberAgreementDocumentStatus;
  fileName: string | null;
  fileUrl: string | null;
  uploadedAt: Date | null;
}) {
  return {
    documentType: row.documentType,
    status: toPublicStatus(row.status),
    fileName: row.fileName,
    hasUpload: Boolean(row.fileUrl),
    uploadedAt: row.uploadedAt?.toISOString() ?? null,
  };
}

export async function getOrCreateStopOrderRecord(userId: string) {
  return prisma.memberAgreementDocument.upsert({
    where: {
      userId_documentType: { userId, documentType: STOP_ORDER_DOCUMENT_TYPE },
    },
    create: {
      userId,
      documentType: STOP_ORDER_DOCUMENT_TYPE,
      status: "PENDING",
    },
    update: {},
  });
}

export async function getStopOrderStatus(userId: string) {
  const row = await prisma.memberAgreementDocument.findUnique({
    where: {
      userId_documentType: { userId, documentType: STOP_ORDER_DOCUMENT_TYPE },
    },
  });
  if (!row) {
    return toPublicStopOrderDocument({
      documentType: STOP_ORDER_DOCUMENT_TYPE,
      status: "PENDING",
      fileName: null,
      fileUrl: null,
      uploadedAt: null,
    });
  }
  return toPublicStopOrderDocument(row);
}

export function buildStopOrderFilename(userId: string, ext: string): string {
  const safeExt = ext.startsWith(".") ? ext : `.${ext}`;
  return `stop_order_${userId}_${Date.now()}${safeExt}`;
}

/** Persist upload and mirror into MemberDocument for admin compliance views. */
export async function saveStopOrderUpload(
  userId: string,
  relPath: string,
  originalFileName: string
): Promise<ReturnType<typeof toPublicStopOrderDocument>> {
  const accountType = await getUserAccountType(userId);
  const uploadedAt = new Date();

  const row = await prisma.memberAgreementDocument.upsert({
    where: {
      userId_documentType: { userId, documentType: STOP_ORDER_DOCUMENT_TYPE },
    },
    create: {
      userId,
      documentType: STOP_ORDER_DOCUMENT_TYPE,
      status: "SUBMITTED",
      fileUrl: relPath,
      fileName: originalFileName,
      uploadedAt,
    },
    update: {
      status: "SUBMITTED",
      fileUrl: relPath,
      fileName: originalFileName,
      uploadedAt,
    },
  });

  await prisma.memberDocument.upsert({
    where: { userId },
    create: {
      userId,
      accountType,
      loanProductType: "SALARY_BACKED",
      stopOrderFilePath: relPath,
      stopOrderStatus: "PENDING",
    },
    update: {
      loanProductType: "SALARY_BACKED",
      stopOrderFilePath: relPath,
      stopOrderStatus: "PENDING",
    },
  });

  return toPublicStopOrderDocument(row);
}

export async function assertStopOrderAllowsSalaryLoan(userId: string): Promise<void> {
  const row = await prisma.memberAgreementDocument.findUnique({
    where: {
      userId_documentType: { userId, documentType: STOP_ORDER_DOCUMENT_TYPE },
    },
  });
  if (!row?.fileUrl || row.status === "PENDING") {
    throw validationError("Loan repayment stop order must be uploaded before applying for a salary-based loan.", {
      fields: [{ field: "stopOrder", error: "Upload required" }],
    });
  }
  if (row.status === "REJECTED") {
    throw validationError("Loan repayment stop order was rejected. Please upload a corrected document.", {
      fields: [{ field: "stopOrder", error: "Document rejected" }],
    });
  }
}

export async function syncStopOrderReviewStatus(
  userId: string,
  status: "PENDING" | "VERIFIED" | "REJECTED"
): Promise<void> {
  const mapped: MemberAgreementDocumentStatus =
    status === "VERIFIED" ? "APPROVED" : status === "REJECTED" ? "REJECTED" : "SUBMITTED";

  await prisma.memberAgreementDocument.updateMany({
    where: { userId, documentType: STOP_ORDER_DOCUMENT_TYPE },
    data: { status: mapped },
  });
}

export function resolvePrivateUploadPath(relPath: string): string {
  const cwd = process.cwd();
  const abs = path.resolve(cwd, relPath);
  const root = path.resolve(cwd, "uploads", "member-agreements", "stop-orders");
  if (!abs.startsWith(root)) {
    throw validationError("Invalid path");
  }
  return abs;
}

export function deleteStopOrderFileIfExists(relPath: string | null | undefined): void {
  if (!relPath) return;
  try {
    const abs = resolvePrivateUploadPath(relPath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch {
    /* best-effort cleanup */
  }
}
