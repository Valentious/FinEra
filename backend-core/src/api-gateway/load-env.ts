/**
 * Must be imported before any module that reads process.env (e.g. Prisma DATABASE_URL).
 * ESM runs imports in order — keep this as the first side-effect import in server.ts.
 */
import { config } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
config({ path: join(dir, "../../.env") });

/** Local dev only: allow starting without a .env file (never use these in production). */
const dev = process.env.NODE_ENV !== "production";
if (dev) {
  if (!process.env.JWT_SECRET?.trim() || process.env.JWT_SECRET.length < 32) {
    process.env.JWT_SECRET = "dev-jwt-secret-min-32-characters-required!!";
  }
  if (!process.env.JWT_REFRESH_SECRET?.trim() || process.env.JWT_REFRESH_SECRET.length < 32) {
    process.env.JWT_REFRESH_SECRET = "dev-refresh-secret-min-32-characters-required!!";
  }
}
