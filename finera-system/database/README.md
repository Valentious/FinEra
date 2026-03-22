# FinEra Database Foundation

Production-ready Prisma/PostgreSQL implementation for FinEra Inclusive Credit.

## Setup

```bash
# Install dependencies
npm install

# Copy environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Generate Prisma client
npm run db:generate

# Run migrations (requires PostgreSQL running)
npm run db:migrate:dev   # Development
npm run db:migrate       # Production deploy

# Seed initial data
npm run db:seed
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| DATABASE_POOL_SIZE | Connection pool size (default: 20) |
| DATABASE_CONNECTION_TIMEOUT | Timeout in seconds (default: 30) |
| JWT_SECRET | JWT signing secret |
| ENCRYPTION_KEY | For sensitive data encryption |

## Scripts

| Script | Purpose |
|--------|---------|
| db:generate | Generate Prisma client |
| db:migrate | Deploy migrations (production) |
| db:migrate:dev | Create and apply migrations (dev) |
| db:seed | Seed learning modules, admin user |
| db:studio | Open Prisma Studio |
| db:reset | Reset database (force) |

## Docker (PostgreSQL)

```bash
cd ../infrastructure/docker
docker compose up -d postgres
```

Then set `DATABASE_URL="postgresql://finera:finera_secure@localhost:5432/finera_db?schema=public"` in `.env`.

## Test Connection

```bash
npx tsx src/tests/db.test.ts
```

## Exports

```ts
import { db, getPrisma, WalletService } from '@finera/database';
```
