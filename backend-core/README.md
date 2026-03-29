# FinEra Backend Core

Production-grade backend for FinEra Inclusive Credit platform.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis (optional, for sessions/queues)
- **Auth**: JWT (access + refresh tokens)
- **Security**: bcrypt, Helmet, rate limiting, Zod validation

## Architecture

### System layers

| Layer | Location | Role |
|--------|----------|------|
| **Presentation** | Repository root `src/` (React/Vite frontend) | UI, client-side validation, calls HTTP APIs only |
| **Application** | `backend-core/` - `src/api-gateway/` + `src/services/*` | Business rules, orchestration, credit scoring, ledger flows |
| **Data** | PostgreSQL + Prisma (`prisma/schema.prisma`, `src/infrastructure/database/`) | Persistent storage; access goes through Prisma in services |

### Inside the backend: gateway vs services

- **`src/api-gateway/`** (communication layer): HTTP server entry (`server.ts`), Express app (`app.ts`), route mounting, global middleware (CORS, Helmet, rate limits), health/readiness. This is the **only** process entry point for `npm run dev` / `npm start`.
- **`src/services/*`** (logic tier): Domain behavior grouped by bounded context:
  - `auth-service/` - authentication, sessions, OTP
  - `user-service/` - profile, KYC uploads, reference/registration data
  - `credit-engine/` - scoring, limits, loans, interest; `domain/` holds pure engines
  - `ledger-service/` - wallets, transactions, currencies, FX, fraud middleware
  - `admin-service/` - notifications, learning, partner program

Shared cross-cutting code stays at `src/` scope: `middlewares/`, `infrastructure/`, `config/`, `core/`, `shared/`, `types/`, `constants/`.

### Boundaries and scaling

- **Target rule:** services do not import another service’s *internal* modules; communicate via **HTTP APIs** (or a message bus) when split into separate deployables. Today the repo may still ship as one Node process for velocity; treat direct imports between services as **technical debt** to replace with API calls when you extract containers.
- **Database:** Prisma client usage should remain in the service that owns that aggregate; avoid ad hoc SQL scattered outside `infrastructure` + service repositories.

### Docker (current vs target)

- **Current:** `docker-compose.yml` runs **PostgreSQL** and **Redis** for local development. The API runs on the host via `npm run dev` (or your process manager).
- **Target (multi-container):** one image per service (`api-gateway`, each `*-service`), **api-gateway** as the only public port (e.g. `4000`), internal URLs for service-to-service calls, shared `DATABASE_URL` / secrets via env. Add Dockerfiles per service when you split the monolith; until then, a single backend image building `dist/api-gateway/server.js` remains valid.

## Quick Start

### 1. Install Dependencies

```bash
cd backend-core
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, etc.
```

### 3. Database Setup

**Ensure database is ready** (PostgreSQL running, .env configured, finera_db exists):

```powershell
.\scripts\ensure-db-ready.ps1
```

This checks:
1. **PostgreSQL** is running on port 5432 (start with `docker compose up -d postgres` if needed)
2. **`.env`** exists with valid `DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/finera_db"`
3. **finera_db** exists (create with `psql -U postgres -c "CREATE DATABASE finera_db;"` if missing)

Then:

```bash
# Generate Prisma client
npm run db:generate

# Push schema (development)
npm run db:push

# Or run migrations (production)
npm run db:migrate

# Seed test data
npm run db:seed
```

### 4. Run

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

Server runs on `http://localhost:4000` by default.

## API Endpoints

### Auth
- `POST /api/v1/auth/register` - Register (creates `PENDING_VERIFICATION` user, emails OTP)
- `POST /api/v1/auth/verify-email` - Verify email OTP (`{ email, code }`), returns JWTs
- `POST /api/v1/auth/resend-otp` - Resend registration OTP
- `POST /api/v1/auth/login` - Login (blocked until email verified)
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

**Removed:** `POST /auth/send-email-code` and `POST /auth/verify-email-code` (pre-register OTP). See repo [docs/PROJECT_STATUS.md](../docs/PROJECT_STATUS.md).

### User (authenticated)
- `GET /api/v1/user/profile` - Profile
- `GET /api/v1/user/wallets` - Wallets

### Transactions (authenticated)
- `POST /api/v1/transactions/deposit`
- `POST /api/v1/transactions/withdraw`
- `GET /api/v1/transactions`
- `GET /api/v1/transactions/:id`

### Credit (authenticated)
- `GET /api/v1/credit/score`
- `GET /api/v1/credit/limit`
- `POST /api/v1/credit/apply`
- `GET /api/v1/credit/loans`

### Notifications (authenticated)
- `GET /api/v1/notifications`
- `PUT /api/v1/notifications/:id/read`

### KYC (authenticated)
- `POST /api/v1/kyc/upload` - Multipart form: documentType, file
- `GET /api/v1/kyc/status`

### Health
- `GET /health` - Liveness
- `GET /ready` - Readiness (checks DB)

## Project Structure

```
backend-core/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── api-gateway/          # HTTP entry: app.ts, server.ts
│   ├── services/
│   │   ├── auth-service/
│   │   ├── user-service/
│   │   ├── credit-engine/
│   │   ├── ledger-service/
│   │   └── admin-service/
│   ├── config/
│   ├── constants/
│   ├── core/
│   ├── infrastructure/       # Prisma / DB connection
│   ├── middlewares/
│   ├── shared/
│   ├── types/
│   └── test/
├── .env.example
├── package.json
└── tsconfig.json
```

## Security

- Password hashing: bcrypt (12 rounds)
- JWT: 15min access, 7d refresh
- Rate limits: 5/min auth, 100/min general
- CORS: Whitelist FRONTEND_URL only
- Helmet: Security headers

## Credit Engine

Financial Discipline Score (0-100) formula:
- Repayment Reliability: 40%
- Savings Consistency: 25%
- Transaction Health: 20%
- Account Longevity: 10%
- KYC Level Bonus: 5%

Country-specific base limits apply. See `src/constants/index.ts`.
