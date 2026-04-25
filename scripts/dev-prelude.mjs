/**
 * Runs before `npm run dev` (Vite + backend-core).
 * Starts Docker Postgres + Redis from backend-core/docker-compose.yml and waits for DB readiness.
 */

import { execSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backendCore = path.join(root, "backend-core");

function run(cmd, opts = {}) {
  execSync(cmd, {
    stdio: opts.stdio ?? "inherit",
    cwd: opts.cwd ?? root,
    shell: true,
    env: { ...process.env, ...opts.env },
  });
}

function dockerAvailable() {
  try {
    execSync("docker version", { stdio: "pipe", shell: true });
    return true;
  } catch {
    return false;
  }
}

async function waitPostgresReady(maxMs = 90000) {
  const step = 1500;
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    try {
      execSync("docker compose exec -T postgres pg_isready -U finera -d finera_db", {
        stdio: "pipe",
        cwd: backendCore,
        shell: true,
      });
      return true;
    } catch {
      await delay(step);
    }
  }
  return false;
}

async function main() {
  console.log(`
[FinEra] Dev stack
  • Frontend (Vite):  http://localhost:5173
  • API (Express):    http://localhost:4000
  • Database:         Docker Postgres (backend-core/docker-compose.yml)
    Default URL:       postgresql://finera:finera_secure@localhost:5432/finera_db

First time:  npm run install:backend   (repo root)
`);

  const genScript = path.join(backendCore, "scripts", "prisma-generate-safe.mjs");
  try {
    console.log("[FinEra] Prisma client (generate if needed)…");
    run(`node "${genScript}"`, { cwd: root });
  } catch (e) {
    console.error("[FinEra] Prisma generate failed:", e?.message ?? e);
    console.error("[FinEra] Fix file locks (stop other Node/Prisma Studio), then run npm run dev again.\n");
    process.exit(1);
  }

  if (!dockerAvailable()) {
    console.warn("[FinEra] Docker is not running or not installed — start Docker Desktop, then run npm run dev again.");
    console.warn("[FinEra] If you use a local Postgres on :5432 with finera_db, the API may still connect.\n");
    return;
  }

  try {
    console.log("[FinEra] docker compose up -d (Postgres + Redis)…");
    run("docker compose up -d", { cwd: backendCore });
  } catch (e) {
    console.warn("[FinEra] docker compose up failed:", e?.message ?? e);
    console.warn("[FinEra] Continuing; ensure containers exist: cd backend-core && docker compose up -d\n");
    return;
  }

  console.log("[FinEra] Waiting for Postgres (pg_isready)…");
  const ok = await waitPostgresReady();
  if (ok) {
    console.log("[FinEra] Postgres is ready. Starting Vite + API…\n");
  } else {
    console.warn(
      "[FinEra] Postgres did not become ready in time. Try: cd backend-core && docker compose logs postgres"
    );
    console.warn("[FinEra] Continuing; the API will retry DB on first requests.\n");
  }
}

await main();
