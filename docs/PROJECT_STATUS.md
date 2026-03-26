# FinEra — project status (current)

**Last updated:** aligned with `main` after onboarding, currency, and documentation refactors.  
**Canonical remote:** [github.com/Valentious/FinEra](https://github.com/Valentious/FinEra)

## Verified locally

- `npm run build` (Vite) completes without errors.
- `backend-core`: `npx tsc --noEmit` passes after schema/API changes.
- Health and setup: [SETUP_GUIDE.md](../SETUP_GUIDE.md), [CHECKLIST.md](../CHECKLIST.md).

---

## Removed or retired (do not expect in the current codebase)

| Item | Notes |
| --- | --- |
| **USDT (Tether) dashboard & currency** | Removed from `CurrencyCode` enum, seeds, currency fallbacks, wallet allowlists, and UI types. Supported fiat/crypto rails in UI are **USD, ZIG, ZAR** (plus **EUR, GBP** where backend/registry exposes them). |
| **Pre-registration email OTP flow** | Old flow: `POST /auth/send-email-code` + `POST /auth/verify-email-code` + JWT before `register`. **Removed.** Module `email-verification.service.ts` (in-memory OTP + pre-register token) deleted. |
| **Casual splash copy** | Phrase *“Your Financial Operating System”* replaced with **“Your Financial Lifeline”** (`SplashScreen.tsx`). |
| **Waving emoji in dashboard greeting** | Removed from `Dashboard.tsx` / `DashboardV2.tsx` headers. |
| **VerifyAccess line** | *“…for academic credit access.”* removed from identity verification copy (`VerifyAccess.tsx`). |

---

## Current authentication & onboarding (summary)

1. **`POST /api/v1/auth/register`** — Creates user in **`PENDING_VERIFICATION`**, stores **bcrypt-hashed** email OTP + expiry, sends email (or dev log), returns `{ userId, email }` (no session).
2. **`POST /api/v1/auth/verify-email`** — `{ email, code }` → verifies OTP, sets **`ACTIVE`** + **`emailVerified`**, returns **JWT access + refresh** (auto sign-in).
3. **`POST /api/v1/auth/resend-otp`** — Resend with cooldown + hourly cap.
4. **Frontend:** Register tab → **`/verify-email?email=…`** (`VerifyEmailPage`) → on success, session + continue onboarding (e.g. `VerifyAccess`).
5. **Login** — Blocked until email verified (`PENDING_VERIFICATION` → clear error).

Supporting files: `backend-core/src/modules/auth/auth.service.ts`, `otp-rate-limit.ts`, `email-delivery.ts`, `auth.routes.ts`, `auth.validation.ts`.

---

## Development conveniences (not for production as-is)

| Setting | Purpose |
| --- | --- |
| `EMAIL_OTP_ACCEPT_ANY` | In **development** (`NODE_ENV=development`), any **6-digit** OTP is accepted unless set to `false`. In **production**, strict OTP unless explicitly set to `true` (discouraged). See `backend-core/.env.example`. |
| `USE_MOCK_DATA` (`src/services/index.ts`) | **`true`** = browser `mockApi` + localStorage; set **`false`** for real `backend-core` API. |

---

## Known gaps / missing vs a full production launch

| Gap | Detail |
| --- | --- |
| **Prisma migrations** | Some environments used `prisma db push` when migration history was inconsistent (`0_init`). Prefer repairing migration history or a clean baseline before production. |
| **README_BACKEND_INTEGRATION.md** | Still references `REACT_APP_API_URL` / `npm start`; this app uses **Vite** (`VITE_API_URL`, `npm run dev`). Update when touching onboarding docs. |
| **OTP bypass** | Turn off `EMAIL_OTP_ACCEPT_ANY` (or run `NODE_ENV=production` with strict env) before any security review. |
| **Legacy DB rows** | After removing **USDT**, databases that had USDT rows required enum sync (`db push --accept-data-loss` or manual cleanup). New clones are clean. |

---

## Frontend — current UI behaviour (short)

- **Registration:** Full form → API register → **email verification route** (no OTP on the same screen as the full form).
- **Deposits / withdrawals:** Methods as implemented in `DepositFlow` / `WithdrawFlow` (e.g. Ecocash, cardless, agent — see components).
- **Dashboard:** Multi-currency tabs driven by **`/currencies`** (no USDT).

---

## Rollout & readiness (IT / operations)

| Phase | Focus | Exit criteria |
| --- | --- | --- |
| **1 — Requirements & sourcing** | Environments, compliance, hosting, secrets. | Runbook; vendor alignment where needed. |
| **2 — Procurement & provisioning** | DB, TLS, monitoring, backups. | Staging API + DB reachable. |
| **3 — Integration** | Deploy `backend-core`; `VITE_API_URL` → staging; CORS + JWT verified. | [CHECKLIST.md](../CHECKLIST.md) on staging. |
| **4 — QA & security** | Rate limits, JWT rotation, PII, pen-test backlog. | No criticals; alerts on. |
| **5 — Production** | Rolling deploy, backups, playbooks. | Health green; rollback tested. |

---

## What to update when the product changes

1. **This file** — removals, gaps, auth/currency behaviour.  
2. **[README.md](../README.md)** — stack / quick start if commands or ports change.  
3. **[CHECKLIST.md](../CHECKLIST.md)** — new endpoints or smoke tests.  
4. **[BACKEND_API_SPECIFICATION.md](../BACKEND_API_SPECIFICATION.md)** — API contract.  
5. **`backend-core/README.md`** — auth and currency lists.
