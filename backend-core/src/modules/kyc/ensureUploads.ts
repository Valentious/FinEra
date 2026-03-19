/**
 * Ensure uploads directory exists
 */
import { mkdirSync, existsSync } from "fs";
import { join } from "path";

const uploadsDir = join(process.cwd(), "uploads", "kyc");
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}
