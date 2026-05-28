import "../member-documents/ensure-uploads.js";
import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import type { DocumentTemplateType } from "@prisma/client";
import { prisma } from "../../infrastructure/database/index.js";
import { authMiddleware, requireRoles } from "../../middlewares/auth.js";
import { forbiddenError, validationError } from "../../middlewares/errorHandler.js";
import { assertAllowedUploadMime, extensionForMime, STOP_ORDER_MAX_BYTES } from "../../lib/upload-validation.js";
import {
  buildStopOrderFilename,
  deleteStopOrderFileIfExists,
  getOrCreateStopOrderRecord,
  getStopOrderStatus,
  saveStopOrderUpload,
  STOP_ORDER_STORAGE_DIR,
} from "./stop-order.service.js";

const router = Router();
router.use(authMiddleware);
router.use(requireRoles("staff"));

function requireProfessionalAccount(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.accountType?.toUpperCase() !== "STAFF") {
    next(forbiddenError("Professional account required for this action"));
    return;
  }
  next();
}

router.use(requireProfessionalAccount);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(STOP_ORDER_STORAGE_DIR, { recursive: true });
    cb(null, STOP_ORDER_STORAGE_DIR);
  },
  filename: (req, file, cb) => {
    const userId = req.user!.id;
    const ext = extensionForMime(file.mimetype) || path.extname(file.originalname) || ".pdf";
    cb(null, buildStopOrderFilename(userId, ext));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: STOP_ORDER_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type"));
  },
});

router.get("/", async (req, res, next) => {
  try {
    const data = await getStopOrderStatus(req.user!.id);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

router.get("/template/download", async (_req, res, next) => {
  try {
    const docType = "REPAYMENT_STOP_ORDER" as DocumentTemplateType;
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
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="LOAN REPAYMENT STOP ORDER.pdf"'
    );
    fs.createReadStream(abs).pipe(res);
  } catch (e) {
    next(e);
  }
});

router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throw validationError("No file uploaded");

    try {
      assertAllowedUploadMime(req.file.mimetype, req.file.path);
    } catch {
      fs.unlinkSync(req.file.path);
      throw validationError("Invalid file type. Only PDF, PNG, and JPEG are allowed.");
    }

    const userId = req.user!.id;
    const existing = await getOrCreateStopOrderRecord(userId);
    deleteStopOrderFileIfExists(existing.fileUrl);

    const relPath = path.join("uploads", "member-agreements", "stop-orders", req.file.filename);

    const data = await saveStopOrderUpload(userId, relPath, req.file.originalname || "stop-order");

    res.status(201).json({
      success: true,
      data: {
        ...data,
        message: "Submitted for review",
      },
    });
  } catch (e) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        /* ignore */
      }
    }
    next(e);
  }
});

export default router;
