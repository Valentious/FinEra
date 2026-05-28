import "./ensure-uploads.js";
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "node:fs";
import { randomUUID } from "crypto";
import { z } from "zod";
import type { DocumentTemplateType, LoanProductType } from "@prisma/client";
import { prisma } from "../../infrastructure/database/index.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { validationError } from "../../middlewares/errorHandler.js";
import {
  assertDocumentsAllowLoanApplication,
  getUserAccountType,
  toPublicMemberDocument,
  upsertDocumentContext,
} from "./member-documents.service.js";

const router = Router();
router.use(authMiddleware);

const loanProductEnum = z.enum(["ASSET_BACKED", "SALARY_BACKED", "COLLATERAL", "NON_COLLATERAL"]);

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const uid = req.user!.id;
    const dir = path.join("uploads", "member-documents", uid);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname) || ".pdf"}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type"));
  },
});

router.get("/status", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const [md, emp, compliance] = await Promise.all([
      prisma.memberDocument.findUnique({ where: { userId } }),
      prisma.employmentDetails.findUnique({ where: { userId } }),
      prisma.memberDefaultCompliance.findUnique({ where: { userId } }),
    ]);

    res.json({
      success: true,
      data: {
        memberDocument: md ? toPublicMemberDocument(md) : null,
        employment: emp
          ? {
              employerName: emp.employerName,
              employerContact: emp.employerContact,
              jobTitle: emp.jobTitle,
              salaryEstimate: Number(emp.salaryEstimate),
              verified: emp.verified,
            }
          : null,
        compliance: compliance
          ? {
              defaultFlagged: compliance.defaultFlagged,
              payrollEnforcementEligible: compliance.payrollEnforcementEligible,
              consecutiveMissedRepayments: compliance.consecutiveMissedRepayments,
            }
          : null,
      },
    });
  } catch (e) {
    next(e);
  }
});

const contextSchema = z.object({
  loanProductType: loanProductEnum,
});

router.put("/context", async (req, res, next) => {
  try {
    const parsed = contextSchema.safeParse(req.body);
    if (!parsed.success) throw validationError("Invalid loan product type");
    await upsertDocumentContext(req.user!.id, parsed.data.loanProductType as LoanProductType);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/upload",
  upload.single("file"),
  async (req, res, next) => {
    try {
      const kind = String(req.body.kind || "");
      if (kind !== "agreement" && kind !== "consent" && kind !== "stop_order") {
        throw validationError('kind must be "agreement", "consent", or "stop_order"');
      }
      if (!req.file) throw validationError("No file uploaded");

      const ltParsed = loanProductEnum.safeParse(req.body.loanProductType);
      if (!ltParsed.success) throw validationError("loanProductType required");
      const loanProductType = ltParsed.data as LoanProductType;

      if (kind === "consent" && loanProductType !== "SALARY_BACKED") {
        throw validationError("Payroll consent applies only to salary-based loans");
      }
      if (kind === "stop_order" && loanProductType !== "SALARY_BACKED") {
        throw validationError("Repayment stop order applies only to salary-based loans");
      }

      const userId = req.user!.id;
      const accountType = await getUserAccountType(userId);
      const relPath = path.join("uploads", "member-documents", userId, req.file.filename);

      const agreementUpdate =
        kind === "agreement"
          ? {
              agreementFilePath: relPath,
              agreementStatus: "PENDING" as const,
            }
          : {};
      const consentUpdate =
        kind === "consent"
          ? {
              consentFilePath: relPath,
              consentStatus: "PENDING" as const,
            }
          : {};
      const stopOrderUpdate =
        kind === "stop_order"
          ? {
              stopOrderFilePath: relPath,
              stopOrderStatus: "PENDING" as const,
            }
          : {};

      const initialConsentStatus =
        loanProductType === "SALARY_BACKED"
          ? ("PENDING" as const)
          : null;

      await prisma.memberDocument.upsert({
        where: { userId },
        create: {
          userId,
          accountType,
          loanProductType,
          ...agreementUpdate,
          ...consentUpdate,
          ...stopOrderUpdate,
          consentStatus: kind === "consent" ? "PENDING" : initialConsentStatus,
        },
        update: {
          loanProductType,
          ...agreementUpdate,
          ...consentUpdate,
          ...stopOrderUpdate,
        },
      });

      res.status(201).json({ success: true, data: { kind, status: "PENDING" } });
    } catch (e) {
      next(e);
    }
  }
);

const employmentSchema = z.object({
  employerName: z.string().min(1).max(200),
  employerContact: z.string().min(1).max(200),
  jobTitle: z.string().min(1).max(200),
  salaryEstimate: z.coerce.number().positive().max(1_000_000_000),
});

const assetNoteSchema = z.object({
  assetDocumentationNote: z.string().max(2000),
  loanProductType: loanProductEnum.optional(),
});

router.patch("/asset-note", async (req, res, next) => {
  try {
    const parsed = assetNoteSchema.safeParse(req.body);
    if (!parsed.success) throw validationError("Invalid asset documentation payload");
    const userId = req.user!.id;
    const accountType = await getUserAccountType(userId);
    const existing = await prisma.memberDocument.findUnique({ where: { userId } });
    const loanProductType = (parsed.data.loanProductType ??
      existing?.loanProductType ??
      "NON_COLLATERAL") as LoanProductType;

    await prisma.memberDocument.upsert({
      where: { userId },
      create: {
        userId,
        accountType,
        loanProductType,
        assetDocumentationNote: parsed.data.assetDocumentationNote,
      },
      update: {
        loanProductType,
        assetDocumentationNote: parsed.data.assetDocumentationNote,
      },
    });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.put("/employment", async (req, res, next) => {
  try {
    const parsed = employmentSchema.safeParse(req.body);
    if (!parsed.success) throw validationError("Invalid employment payload");
    const userId = req.user!.id;
    await prisma.employmentDetails.upsert({
      where: { userId },
      create: {
        userId,
        ...parsed.data,
        salaryEstimate: parsed.data.salaryEstimate,
        verified: false,
      },
      update: {
        ...parsed.data,
        salaryEstimate: parsed.data.salaryEstimate,
        verified: false,
        verifiedAt: null,
        verifiedBy: null,
      },
    });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

const templateParam = z.enum(["AGREEMENT", "PAYROLL_CONSENT", "REPAYMENT_STOP_ORDER"]);

router.get("/templates/:type/download", async (req, res, next) => {
  try {
    const t = templateParam.safeParse(req.params.type);
    if (!t.success) throw validationError("Invalid template type");
    const docType = t.data as DocumentTemplateType;
    const template = await prisma.documentTemplate.findUnique({
      where: { documentType: docType },
    });
    if (!template?.filePath) throw validationError("Template not available");
    const cwd = process.cwd();
    const abs = path.resolve(cwd, template.filePath);
    if (!abs.startsWith(path.resolve(cwd, "uploads"))) {
      throw validationError("Invalid path");
    }
    if (!fs.existsSync(abs)) throw validationError("File missing on server");
    res.setHeader("Content-Type", template.mimeType || "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${template.fileName || "template.pdf"}"`);
    fs.createReadStream(abs).pipe(res);
  } catch (e) {
    next(e);
  }
});

/** Optional self-check before calling apply-instant from client */
router.get("/loan-eligibility/:loanType", async (req, res, next) => {
  try {
    const parsed = loanProductEnum.safeParse(req.params.loanType);
    if (!parsed.success) throw validationError("Invalid loan type");
    try {
      await assertDocumentsAllowLoanApplication(req.user!.id, parsed.data as LoanProductType);
      res.json({ success: true, data: { ok: true } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Not eligible";
      res.json({ success: true, data: { ok: false, reason: msg } });
    }
  } catch (e) {
    next(e);
  }
});

export default router;
