# FinEra — project status (current)

Last aligned with repository: **main** branch, FinEra Inclusive Credit monorepo (frontend + `backend-core`).

## Verified locally

- `npm run build` (Vite) completes without errors.
- Health and setup flows are documented in [SETUP_GUIDE.md](../SETUP_GUIDE.md) and [CHECKLIST.md](../CHECKLIST.md).

## Frontend — current behaviour (UI)

- **Registration / account creation:** Date of birth uses the shared `DatePicker` (calendar popover), age rules (e.g. 16+), ISO `YYYY-MM-DD` values.
- **Deposits:** Methods limited to **Ecocash**, **ATM cardless deposit**, **Payment agent** (`DepositFlow`).
- **Withdrawals:** Methods limited to **Ecocash**, **ATM cardless withdrawal**, **Payment agent** (`WithdrawFlow`).
- **Dashboard:** Greeting header no longer shows a placeholder calendar date string.

## Backend

- API base URL and ports: see [SETUP_GUIDE.md](../SETUP_GUIDE.md) (default **4000**).
- Schema and migrations: `backend-core/prisma/`.

## Rollout & readiness phases (IT / operations)

Use this as a checklist for moving from dev to production. It aligns with common **infrastructure and procurement** lifecycles (hardware, hosting, and third-party services are selected and provisioned in phases 1–3).

| Phase | Focus | Exit criteria |
| --- | --- | --- |
| **1 — Requirements & sourcing** | Define environments (dev/stage/prod), regions, SLAs, compliance. Select hosting/DB (e.g. managed Postgres), secrets store, CI/CD. | Written runbook; approved vendors/contracts where applicable. |
| **2 — Procurement & provisioning** | Order or allocate servers/managed services, domains, TLS, monitoring, backup. | Staging URL + DB reachable; secrets injected via env/secret manager. |
| **3 — Integration** | Deploy `backend-core` + DB migrations; point frontend `VITE_API_URL` at staging API; CORS and auth cookies/tokens verified. | [CHECKLIST.md](../CHECKLIST.md) passes on staging. |
| **4 — QA & security** | Pen-test backlog, rate limits, JWT rotation, PII handling, Prisma query safety. | No critical issues; logging and alerts configured. |
| **5 — Production & operations** | Blue/green or rolling deploy; DB backups; incident playbooks. | Production health checks green; rollback tested once. |

## Remote repository

Canonical Git remote: `https://github.com/Valentious/FinEra.git`  
Ensure `git remote -v` matches your fork or organization before pushing.

## What to update when the product changes

1. This file — feature bullets and phase notes.  
2. [README.md](../README.md) — only if stack or quick start commands change.  
3. [CHECKLIST.md](../CHECKLIST.md) — new endpoints or integration steps.  
4. [BACKEND_API_SPECIFICATION.md](../BACKEND_API_SPECIFICATION.md) — API contract changes.
