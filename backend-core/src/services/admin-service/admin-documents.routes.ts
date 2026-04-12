import "../member-documents/ensure-uploads.js";
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "node:fs";
import { randomUUID } from "crypto";
import { z } from "zod";
import type { DocumentTemplateType, MemberDocumentVerificationStatus } from "@prisma/client";
import { prisma } from "../../infrastructure/database/index.js";
import { adminAuthMiddleware, requireAdminRole } from "../../middlewares/adminAuth.js";
import { validationError } from "../../middlewares/errorHandler.js";
import { recordMissedInstallment } from "../compliance/default-compliance.service.js";

const router = Router();
router.use(adminAuthMiddleware);

const templateStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/document-templates"),
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname) || ".pdf"}`),
});

const templateUpload = multer({
  storage: templateStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type"));
  },
});

const docTypeBody = z.enum(["AGREEMENT", "PAYROLL_CONSENT"]);

router.post(
  "/document-templates",
  requireAdminRole("ADMIN"),
  templateUpload.single("file"),
  async (req, res, next) => {
    try {
      const parsed = docTypeBody.safeParse(req.body.documentType);
      if (!parsed.success) throw validationError("documentType must be AGREEMENT or PAYROLL_CONSENT");
      if (!req.file) throw validationError("No file uploaded");

      const documentType = parsed.data as DocumentTemplateType;
      const relPath = path.join("uploads", "document-templates", req.file.filename);

      const row = await prisma.documentTemplate.upsert({
        where: { documentType },
        create: {
          documentType,
          filePath: relPath,
          fileName: req.file.originalname || "template",
          mimeType: req.file.mimetype,
        },
        update: {
          filePath: relPath,
          fileName: req.file.originalname || "template",
          mimeType: req.file.mimetype,
          uploadedAt: new Date(),
        },
      });

      res.status(201).json({
        success: true,
        data: { documentType: row.documentType, uploadedAt: row.uploadedAt.toISOString() },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get("/document-templates", requireAdminRole("ADMIN", "RISK_OFFICER", "AUDITOR"), async (_req, res, next) => {
  try {
    const rows = await prisma.documentTemplate.findMany({ orderBy: { documentType: "asc" } });
    res.json({
      success: true,
      data: rows.map((r) => ({
        documentType: r.documentType,
        fileName: r.fileName,
        uploadedAt: r.uploadedAt.toISOString(),
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.get("/member-documents/submissions", requireAdminRole("ADMIN", "RISK_OFFICER"), async (_req, res, next) => {
  try {
    const rows = await prisma.memberDocument.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { id: true, email: true, fullName: true, accountType: true } },
      },
      take: 200,
    });
    const empRows = await prisma.employmentDetails.findMany({
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    });
    const empByUser = new Map(empRows.map((e) => [e.userId, e]));
    res.json({
      success: true,
      data: {
        submissions: rows.map((r) => {
          const e = empByUser.get(r.userId);
          return {
            id: r.id,
            user: r.user,
            loanProductType: r.loanProductType,
            agreementStatus: r.agreementStatus,
            consentStatus: r.consentStatus,
            hasAgreementFile: Boolean(r.agreementFilePath),
            hasConsentFile: Boolean(r.consentFilePath),
            adminNotes: r.adminNotes,
            assetDocumentationNote: r.assetDocumentationNote,
            updatedAt: r.updatedAt.toISOString(),
            employment: e
              ? {
                  employerName: e.employerName,
                  employerContact: e.employerContact,
                  jobTitle: e.jobTitle,
                  salaryEstimate: Number(e.salaryEstimate),
                  verified: e.verified,
                }
              : null,
          };
        }),
      },
    });
  } catch (e) {
    next(e);
  }
});

const verifySchema = z.object({
  agreementStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
  consentStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]).nullable().optional(),
  adminNotes: z.string().max(2000).optional(),
  employmentVerified: z.boolean().optional(),
});

router.patch("/member-documents/:userId", requireAdminRole("ADMIN", "RISK_OFFICER"), async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) throw validationError("Invalid body");

    const md = await prisma.memberDocument.findUnique({ where: { userId } });
    if (!md) throw validationError("No member documents for user");

    const agreementStatus = parsed.data.agreementStatus as MemberDocumentVerificationStatus | undefined;
    const consentStatus = parsed.data.consentStatus as MemberDocumentVerificationStatus | null | undefined;

    await prisma.memberDocument.update({
      where: { userId },
      data: {
        ...(agreementStatus ? { agreementStatus } : {}),
        ...(consentStatus !== undefined ? { consentStatus } : {}),
        ...(parsed.data.adminNotes !== undefined ? { adminNotes: parsed.data.adminNotes } : {}),
      },
    });

    if (parsed.data.employmentVerified === true) {
      await prisma.employmentDetails.updateMany({
        where: { userId },
        data: {
          verified: true,
          verifiedAt: new Date(),
          verifiedBy: req.admin!.id,
        },
      });
    }

    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.get(
  "/member-documents/:userId/file",
  requireAdminRole("ADMIN", "RISK_OFFICER"),
  async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const which = String(req.query.which || "");
      if (which !== "agreement" && which !== "consent") {
        throw validationError('which=agreement|consent required');
      }
      const md = await prisma.memberDocument.findUnique({ where: { userId } });
      if (!md) throw validationError("Not found");
      const rel = which === "agreement" ? md.agreementFilePath : md.consentFilePath;
      if (!rel) throw validationError("No file");
      const abs = path.resolve(rel);
      const uploadsRoot = path.resolve("uploads");
      if (!abs.startsWith(uploadsRoot)) throw validationError("Invalid path");
      if (!fs.existsSync(abs)) throw validationError("Missing file");
      res.setHeader("Content-Type", "application/pdf");
      fs.createReadStream(abs).pipe(res);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/loans/:loanId/record-missed-installment",
  requireAdminRole("ADMIN", "RISK_OFFICER"),
  async (req, res, next) => {
    try {
      const loan = await prisma.loan.findUnique({
        where: { id: req.params.loanId },
        select: { id: true },
      });
      if (!loan) throw validationError("Loan not found");
      const result = await recordMissedInstallment(loan.id);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
