/**
 * Windows-friendly `prisma generate`: retries on EPERM/EBUSY when the query engine
 * DLL is briefly locked (dev server, antivirus, another Prisma process).
 *
 * Skips generation when Prisma schema + dependency versions are unchanged and the
 * generated client already exists — avoids rename races on every `npm run dev`.
 *
 * Override skip: PRISMA_FORCE_GENERATE=1
 * Used by postinstall / dev / db:generate.
 */

import { execSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prismaClientDir = path.join(root, "node_modules", ".prisma", "client");
const cacheDir = path.join(root, ".cache");
const fingerprintPath = path.join(cacheDir, "prisma-generate-fingerprint.txt");
const schemaPath = path.join(root, "prisma", "schema.prisma");
const pkgPath = path.join(root, "package.json");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function computeFingerprint() {
  const schema = fs.readFileSync(schemaPath);
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const prismaCli = pkg.dependencies?.prisma ?? pkg.devDependencies?.prisma ?? "";
  const prismaClient = pkg.dependencies?.["@prisma/client"] ?? "";
  return crypto.createHash("sha256").update(schema).update(`|${prismaCli}|${prismaClient}|`).digest("hex");
}

function clientLooksPresent() {
  const indexJs = path.join(prismaClientDir, "index.js");
  if (!fs.existsSync(indexJs)) return false;
  if (process.platform === "win32") {
    return fs.existsSync(path.join(prismaClientDir, "query_engine-windows.dll.node"));
  }
  try {
    const files = fs.readdirSync(prismaClientDir);
    return files.some(
      (n) => (n.includes("libquery_engine") || n.includes("query_engine")) && (n.endsWith(".node") || n.endsWith(".so.node"))
    );
  } catch {
    return false;
  }
}

function shouldSkipGenerate() {
  if (process.env.PRISMA_FORCE_GENERATE === "1") return false;
  if (!fs.existsSync(fingerprintPath)) return false;
  let saved;
  try {
    saved = fs.readFileSync(fingerprintPath, "utf8").trim();
  } catch {
    return false;
  }
  if (!saved) return false;
  try {
    if (saved !== computeFingerprint()) return false;
  } catch {
    return false;
  }
  return clientLooksPresent();
}

function writeFingerprint() {
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(fingerprintPath, computeFingerprint(), "utf8");
  } catch {
    /* non-fatal */
  }
}

function tryRemovePrismaClientDir() {
  try {
    if (fs.existsSync(prismaClientDir)) {
      fs.rmSync(prismaClientDir, { recursive: true, force: true });
    }
  } catch {
    /* locked — next retry or user stops node */
  }
}

/** Unlink Windows engine binaries so Prisma can write fresh files (helps when full rmSync fails). */
function tryUnlinkQueryEngines() {
  if (!fs.existsSync(prismaClientDir)) return;
  let names;
  try {
    names = fs.readdirSync(prismaClientDir);
  } catch {
    return;
  }
  for (const name of names) {
    if (
      name === "query_engine-windows.dll.node" ||
      name.startsWith("query_engine-windows.dll.node.tmp") ||
      name.endsWith(".tmp") ||
      (name.includes("query_engine") && name.endsWith(".node"))
    ) {
      const full = path.join(prismaClientDir, name);
      try {
        fs.unlinkSync(full);
      } catch {
        /* still locked — try rename aside once */
        if (process.platform === "win32" && name === "query_engine-windows.dll.node") {
          try {
            fs.renameSync(full, path.join(prismaClientDir, `query_engine-windows.dll.node.old-${Date.now()}`));
          } catch {
            /* ignore */
          }
        }
      }
    }
  }
}

function isLockError(err) {
  const s = `${err?.stderr ?? ""} ${err?.message ?? err ?? ""}`;
  return (
    /EPERM|EBUSY|ENOTEMPTY|operation not permitted|cannot access the file|being used by another process/i.test(
      s
    ) || /rename/i.test(s)
  );
}

async function main() {
  if (shouldSkipGenerate()) {
    console.log("[prisma-generate-safe] Prisma client is up to date; skipping prisma generate (PRISMA_FORCE_GENERATE=1 to force).");
    return;
  }

  if (process.platform === "win32") {
    await sleep(Number(process.env.PRISMA_GENERATE_WIN_DELAY_MS || 250));
  }

  const maxAttempts = Number(process.env.PRISMA_GENERATE_RETRIES || 12);
  let lastErr;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
      const delay = Math.min(6000, 500 * attempt * attempt);
      await sleep(delay);
      tryUnlinkQueryEngines();
      tryRemovePrismaClientDir();
    } else {
      tryUnlinkQueryEngines();
    }

    try {
      execSync("npx prisma generate", {
        stdio: "inherit",
        cwd: root,
        env: { ...process.env },
        windowsHide: true,
      });
      writeFingerprint();
      return;
    } catch (e) {
      lastErr = e;
      if (!isLockError(e) || attempt === maxAttempts) {
        break;
      }
      console.warn(`[prisma-generate-safe] attempt ${attempt}/${maxAttempts} failed (file lock?), retrying…`);
    }
  }

  console.error(`
[Prisma] prisma generate failed (often EPERM on Windows when query_engine-windows.dll.node is locked).

Do this, then run:  npm run db:generate
  1. Stop the API dev server (Ctrl+C where "npm run dev" / "tsx watch" is running).
  2. Close Prisma Studio if open (npm run db:studio).
  3. In Task Manager, end any stray "Node.js" processes that point at this project folder.
  4. Optional: Windows Security → Virus & threat protection → exclusions → folder:
     ${prismaClientDir}

Original error: ${lastErr?.message ?? lastErr}
`);
  process.exit(typeof lastErr?.status === "number" ? lastErr.status : 1);
}

await main();
