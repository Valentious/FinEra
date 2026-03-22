# FinEra Inclusive Credit – Production System

Production-grade financial infrastructure following American fintech architecture standards. Modular, secure, scalable monorepo designed for parallel service development.

---

## Architecture Overview

```
                    ┌─────────────────┐
                    │   API Gateway   │  :4000
                    │  (Auth + Route) │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Auth Service │   │ User Service  │   │ Credit Engine │
│    :4001     │   │    :4002      │   │    :4003      │
└───────────────┘   └───────────────┘   └───────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│Ledger Service │   │ Notification  │   │ Admin Service │
│    :4004     │   │    :4005      │   │    :4006      │
└───────────────┘   └───────────────┘   └───────────────┘
        │
        ▼
   PostgreSQL + Redis
```

- **API Gateway:** Single entry point, JWT auth, RBAC (USER/ADMIN/SUPER_ADMIN), rate limiting, audit logging
- **Services:** Isolated, own entry point, communicate via REST (event-ready for Kafka/RabbitMQ)
- **Ledger:** Double-entry only (`debit_account`, `credit_account`, `amount`, `transaction_hash`)
- **Credit Engine:** Single centralized engine (Financial Discipline Score™)

---

## Folder Structure

```
finera-system/
├── frontend/
│   ├── user-dashboard/      # User wallet, credit, transactions
│   └── admin-dashboard/     # Stats, audit, risk distribution
├── backend/
│   ├── api-gateway/         # Routes + JWT middleware
│   ├── auth-service/        # Register, login, JWT
│   ├── user-service/       # Profile, KYC
│   ├── credit-engine/      # Score, limit, FDS™
│   ├── ledger-service/     # Double-entry ledger
│   ├── notification-service/
│   └── admin-service/       # Dashboard backend
├── database/                # Prisma/PostgreSQL foundation
│   ├── prisma/
│   │   ├── schema.prisma    # Full production schema
│   │   └── seed.ts          # Learning modules, admin user
│   ├── src/
│   │   ├── lib/db/client.ts # Connection pooling, transaction retry
│   │   └── services/       # WalletService (repository pattern)
│   └── migrations/
├── shared/
│   ├── utils/
│   ├── configs/
│   └── constants/
├── infrastructure/
│   ├── docker/
│   └── scripts/
├── docs/
│   └── AUTO-INTEGRATION-FLOW.md
├── .env.example
└── README.md
```

---

## How Services Communicate

| From | To | Method |
|------|-----|--------|
| Client | API Gateway | REST |
| API Gateway | All services | HTTP proxy (with X-User-Id header) |
| Auth → User, Ledger, Credit, Admin | Event: USER_REGISTERED | REST call or Kafka (future) |
| Ledger → Notification | Event: TRANSACTION_COMPLETED | Future |
| Credit → Notification | Event: CREDIT_SCORE_UPDATED | Future |

**Rule:** Services do NOT import each other's internal code. All communication via REST or events.

---

## Security Baseline

- **JWT** for authentication
- **Roles:** USER, ADMIN, SUPER_ADMIN
- Auth logic isolated in auth-service; API Gateway validates token only

---

## How to Run Locally

### 1. Database

```bash
cd finera-system/infrastructure/docker
docker compose up -d
# Or: run schema manually: psql -U finera -d finera_db -f ../../database/schema.sql
```

### 2. Environment

```bash
cp finera-system/.env.example finera-system/.env
# Edit .env with your values
```

### 3. Backend Services

```bash
cd finera-system/backend/api-gateway && npm install && npm run dev
# In separate terminals:
cd finera-system/backend/auth-service && npm install && npm run dev
cd finera-system/backend/user-service && npm install && npm run dev
cd finera-system/backend/credit-engine && npm install && npm run dev
cd finera-system/backend/ledger-service && npm install && npm run dev
cd finera-system/backend/notification-service && npm install && npm run dev
cd finera-system/backend/admin-service && npm install && npm run dev
```

Or use the startup script (starts all services in dependency order):

```powershell
cd finera-system
npm run start:all
```

This opens 7 PowerShell windows. Gateway runs on **port 5000** (avoids conflict with main backend-core on 4000).

### 4. Frontend

```bash
cd finera-system/frontend/user-dashboard && npm install && npm run dev
cd finera-system/frontend/admin-dashboard && npm install && npm run dev
```

### 5. Test

- API Gateway: http://localhost:4000/health
- Register: `POST http://localhost:4000/api/v1/auth/register` with `{ "email": "test@test.com", "password": "secret" }`

---

## Ledger Design (Critical)

Every transaction is double-entry:

- `debit_account` (wallet UUID)
- `credit_account` (wallet UUID)
- `amount` (positive decimal)
- `transaction_hash` (SHA-256, unique)
- `timestamp`

No direct balance updates. Balances derived from ledger entries.

---

## Event-Ready System

| Event | When | Consumers |
|-------|------|-----------|
| USER_REGISTERED | User signs up | user, ledger, credit-engine, admin |
| TRANSACTION_COMPLETED | Ledger entry created | notification, credit-engine |
| CREDIT_SCORE_UPDATED | Score recalculated | notification, admin |

See `docs/AUTO-INTEGRATION-FLOW.md` for flow design.

---

## Admin Dashboard Backend

Supports:

- Total users
- Active loans
- Default rate
- Risk distribution
- Real-time system activity
- Audit logs

---

## License

Proprietary – FinEra Inclusive Credit
