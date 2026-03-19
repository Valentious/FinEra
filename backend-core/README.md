# FinEra Backend Core

Production-grade backend for FinEra Inclusive Credit platform.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis (optional, for sessions/queues)
- **Auth**: JWT (access + refresh tokens)
- **Security**: bcrypt, Helmet, rate limiting, Zod validation

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
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

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
│   ├── config/
│   ├── constants/
│   ├── core/
│   │   ├── database/
│   │   └── utils/
│   ├── middlewares/
│   ├── modules/
│   │   ├── auth/
│   │   ├── credit/
│   │   ├── kyc/
│   │   ├── notifications/
│   │   ├── security/
│   │   ├── transactions/
│   │   └── users/
│   ├── types/
│   ├── app.ts
│   └── server.ts
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
