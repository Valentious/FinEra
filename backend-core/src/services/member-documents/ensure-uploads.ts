import fs from "node:fs";
import path from "node:path";

const dirs = ["uploads/document-templates", "uploads/member-documents"];

for (const d of dirs) {
  const full = path.join(process.cwd(), d);
  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true });
  }
}
