import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { AdminRole } from "@prisma/client";
import { prisma } from "../../infrastructure/database/index.js";
import { getConfig } from "../../config/index.js";
import { authError } from "../../middlewares/errorHandler.js";
import type { AdminJwtPayload } from "../../middlewares/adminAuth.js";
import { logger } from "../../core/utils/logger.js";
import type { AdminUser } from "@prisma/client";

/** When proto login is on and the table is empty, create one dev admin so seed is not required. */
async function ensureProtoDefaultAdminIfEmpty(): Promise<AdminUser | null> {
  const hash = await bcrypt.hash("proto-auto-created-not-for-production", 12);
  try {
    const count = await prisma.adminUser.count();
    if (count > 0) return null;
    const row = await prisma.adminUser.create({
      data: {
        email: "admin@finera.local",
        fullName: "Development Admin (auto)",
        passwordHash: hash,
        role: "ADMIN",
      },
    });
    logger.warn(
      { email: row.email },
      "ADMIN_PROTO_LOGIN: created default AdminUser - table was empty (development only)"
    );
    return row;
  } catch (e) {
    logger.error(e, "ADMIN_PROTO_LOGIN: AdminUser missing or not usable - apply schema (migrations / db push)");
    return null;
  }
}

export async function loginAdmin(
  email: string,
  password: string
): Promise<{
  accessToken: string;
  expiresIn: number;
  admin: { id: string; email: string; fullName: string; role: AdminRole };
}> {
  const config = getConfig();
  const normalized = email.trim().toLowerCase();

  const proto =
    config.NODE_ENV === "development" && config.ADMIN_PROTO_LOGIN === true;

  let admin: AdminUser | null = await prisma.adminUser.findUnique({ where: { email: normalized } });
  if (proto && (!admin || !admin.isActive)) {
    admin = await prisma.adminUser.findFirst({ where: { isActive: true } });
  }
  if (proto && !admin) {
    await ensureProtoDefaultAdminIfEmpty();
    admin = await prisma.adminUser.findFirst({ where: { isActive: true } });
  }
  if (!admin || !admin.isActive) {
    throw authError("Invalid credentials");
  }

  if (!proto) {
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      throw authError("Invalid credentials");
    }
  } else {
    logger.warn(
      { email: admin.email, proto: true },
      "ADMIN_PROTO_LOGIN: password not verified - development prototype only"
    );
  }
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

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
