/**
 * FinEra Backend - Auth Routes
 */

import { Router } from "express";
import * as authService from "./auth.service.js";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  verifyEmailSchema,
  resendOtpSchema,
} from "./auth.validation.js";
import { validationError } from "../../middlewares/errorHandler.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validationError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, unknown>);
    }
    const result = await authService.register(parsed.data);
    res.status(201).json({
      success: true,
      message: "Account created. Check your email for a verification code.",
      data: result,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/verify-email", async (req, res, next) => {
  try {
    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validationError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, unknown>);
    }
    const tokens = await authService.verifyEmail(parsed.data);
    res.json({
      success: true,
      message: "Email verified. You are signed in.",
      data: tokens,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/resend-otp", async (req, res, next) => {
  try {
    const parsed = resendOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validationError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, unknown>);
    }
    const result = await authService.resendEmailOtp(parsed.data.email);
    res.json({ success: true, message: result.message });
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validationError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, unknown>);
    }
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket?.remoteAddress;
    const userAgent = req.headers["user-agent"];
    const tokens = await authService.login(parsed.data, { ip, userAgent });
    res.json({ success: true, data: tokens });
  } catch (e) {
    next(e);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validationError("Validation failed");
    }
    const tokens = await authService.refresh(parsed.data.refreshToken);
    res.json({ success: true, data: tokens });
  } catch (e) {
    next(e);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (parsed.success) {
      await authService.logout(parsed.data.refreshToken);
    }
    res.json({ success: true, message: "Logged out" });
  } catch (e) {
    next(e);
  }
});

export default router;
