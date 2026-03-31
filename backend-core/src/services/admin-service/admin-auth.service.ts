import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { AdminRole } from "@prisma/client";
import { prisma } from "../../infrastructure/database/index.js";
import { getConfig } from "../../config/index.js";
import { authError } from "../../middlewares/errorHandler.js";
import type { AdminJwtPayload } from "../../middlewares/adminAuth.js";

export async function loginAdmin(
  email: string,
  password: string
): Promise<{
  accessToken: string;
  expiresIn: number;
  admin: { id: string; email: string; fullName: string; role: AdminRole };
}> {
  const normalized = email.trim().toLowerCase();
  const admin = await prisma.adminUser.findUnique({ where: { email: normalized } });
  if (!admin || !admin.isActive) {
    throw authError("Invalid credentials");
  }
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    throw authError("Invalid credentials");
  }
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  const config = getConfig();
  const payload: AdminJwtPayload = {
    sub: admin.id,
    email: admin.email,
    type: "access",
    kind: "admin",
    role: admin.role,
  };
  const accessToken = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRY,
  } as SignOptions);

  const decoded = jwt.decode(accessToken) as { exp?: number; iat?: number };
  const expiresIn = decoded?.exp && decoded?.iat ? decoded.exp - decoded.iat : 900;

  return {
    accessToken,
    expiresIn,
    admin: { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role },
  };
}
