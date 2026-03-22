# FinEra Auto-Integration Flow

## User Registration Flow (Implemented)

When a user registers, the following flow is triggered:

1. **Auth Service** (`POST /api/v1/auth/register`)
   - Validates input (Zod)
   - Creates user in DB (transaction)
   - **Orchestrates** parallel HTTP calls to:
     - User Service: profile creation
     - Ledger Service: wallet creation
     - Credit Engine: score initialization
     - Admin Service: audit log
   - Returns JWT + service results
   - **Compensation:** On wallet failure, logs REGISTRATION_COMPENSATION

2. **User Service** (`POST /api/v1/users/profile`)
   - Creates/updates LearningProfile
   - Uses shared database

3. **Ledger Service** (`POST /api/v1/ledger/wallets`)
   - Creates wallet for user
   - Writes WALLET_CREATED audit log

4. **Credit Engine** (`POST /api/v1/credit/initialize`)
   - Initializes credit score (0–100)
   - Risk level by score; user type bonus

5. **Admin Service** (`POST /api/v1/admin/audit`)
   - Logs USER_REGISTERED audit entry

## Resilience

- **Circuit Breaker:** Per-service failure tracking
- **Retry:** Exponential backoff (3–5 retries)
- **Failure Isolation:** Promise.allSettled; one failure doesn’t block others
- **Compensation:** On critical wallet failure, audit log for manual review

## Event Types (Event-Ready)

| Event | Emitter | Consumers |
|-------|---------|-----------|
| USER_REGISTERED | auth-service | user, ledger, credit-engine, admin |
| TRANSACTION_COMPLETED | ledger-service | notification, credit-engine |
| CREDIT_SCORE_UPDATED | credit-engine | notification, admin |

## Run Locally

```bash
# 1. Start PostgreSQL (Docker)
cd infrastructure/docker && docker compose up -d postgres

# 2. Migrate database
cd database && npm run db:migrate:dev && npm run db:seed

# 3. Start services (in separate terminals)
npm run dev:user
npm run dev:ledger
npm run dev:credit
npm run dev:admin
npm run dev:auth

# 4. Test registration
npm run test:registration
```
