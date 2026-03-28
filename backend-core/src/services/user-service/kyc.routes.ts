/**
 * FinEra Backend - KYC Routes
 */

import "./ensureUploads.js";
import { Router } from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "../../infrastructure/database/index.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { validationError } from "../../middlewares/errorHandler.js";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/kyc"),
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname) || ".bin"}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type"));
  },
});

router.use(authMiddleware);

const DOCUMENT_TYPE_MAP: Record<string, { documentType: "NATIONAL_ID" | "SELFIE" | "PROOF_OF_ADDRESS"; documentSide?: "FRONT" | "BACK" | "SINGLE" }> = {
  ID_FRONT: { documentType: "NATIONAL_ID", documentSide: "FRONT" },
  ID_BACK: { documentType: "NATIONAL_ID", documentSide: "BACK" },
  SELFIE: { documentType: "SELFIE", documentSide: "SINGLE" },
  PROOF_OF_ADDRESS: { documentType: "PROOF_OF_ADDRESS", documentSide: "SINGLE" },
};

router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    const documentType = req.body.documentType as string;
    const mapping = DOCUMENT_TYPE_MAP[documentType];
    if (!mapping || !["ID_FRONT", "ID_BACK", "SELFIE", "PROOF_OF_ADDRESS"].includes(documentType)) {
      throw validationError("Invalid document type");
    }
    if (!req.file) throw validationError("No file uploaded");
    const filePath = path.join("uploads", "kyc", req.file.filename);

    const doc = await prisma.kycDocument.create({
      data: {
        userId: req.user!.id,
        documentType: mapping.documentType,
        documentSide: mapping.documentSide ?? "SINGLE",
        filePath,
        status: "PENDING",
      },
    });

    res.status(201).json({ success: true, data: { documentId: doc.id, status: doc.status } });
  } catch (e) {
    next(e);
  }
});

router.get("/status", async (req, res, next) => {
  try {
    const docs = await prisma.kycDocument.findMany({
      where: { userId: req.user!.id },
      orderBy: { uploadedAt: "desc" },
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { accountTier: true },
    });

    const tierToLevel: Record<string, number> = { TIER_0: 0, TIER_1: 1, TIER_2: 2, TIER_3: 3 };
    const kycLevel = user ? (tierToLevel[user.accountTier] ?? 0) : 0;
    const isVerified = kycLevel >= 2;

    res.json({
      success: true,
      data: {
        isVerified,
        kycLevel,
        documents: docs.map((d) => ({ id: d.id, type: d.documentType, status: d.status })),
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
