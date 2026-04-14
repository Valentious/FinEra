#!/bin/sh
# One-command local dev: Docker Postgres + Redis, Prisma, then frontend + backend on the host.
# Run from repo root: sh start-dev.sh   or: bash start-dev.sh

set -eu

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

COMPOSE="docker compose -f docker-compose.dev.yml"

# Published ports on the host (backend runs outside Docker)
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:password@localhost:5433/finera}"
export REDIS_URL="${REDIS_URL:-redis://localhost:6379}"

echo "Starting PostgreSQL and Redis..."
$COMPOSE up -d postgres redis

echo "Waiting for Postgres to be ready..."
attempts=0
until $COMPOSE exec -T postgres pg_isready -U postgres -d finera >/dev/null 2>&1; do
  attempts=$((attempts + 1))
  if [ "$attempts" -gt 60 ]; then
    echo "Postgres did not become ready in time." >&2
    exit 1
  fi
  sleep 1
done

echo "Generating Prisma client and syncing schema..."
cd backend-core
npx prisma generate
npx prisma db push
cd "$ROOT"

echo "Starting frontend and backend (Ctrl+C to stop)..."
npm run dev
