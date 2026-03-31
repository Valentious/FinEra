import { Router } from "express";
import { z } from "zod";
import { loginAdmin } from "./admin-auth.service.js";
import { adminAuthMiddleware, ADMIN_ACCESS_COOKIE } from "../../middlewares/adminAuth.js";
import { getConfig } from "../../config/index.js";

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const data = await loginAdmin(body.email, body.password);
    const config = getConfig();
    const secure = config.NODE_ENV === "production";
    res.cookie(ADMIN_ACCESS_COOKIE, data.accessToken, {
      httpOnly: true,
      secure,
      sameSite: "strict",
      path: "/",
      maxAge: data.expiresIn * 1000,
    });
    const { accessToken: _omit, ...rest } = data;
    res.json({ success: true, data: rest });
  } catch (e) {
    next(e);
  }
});

router.post("/logout", (_req, res) => {
  const cfg = getConfig();
  res.clearCookie(ADMIN_ACCESS_COOKIE, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: cfg.NODE_ENV === "production",
  });
  res.json({ success: true });
});

router.get("/me", adminAuthMiddleware, (req, res) => {
  res.json({ success: true, data: { admin: req.admin } });
});

export default router;
