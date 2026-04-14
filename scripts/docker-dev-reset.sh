#!/bin/sh
# FinEra dev stack: clean volumes, bring up DB + Redis, Prisma from host, then full compose.
# Requires: Docker Compose v2, repo root as cwd (or run via npm run dev:docker:reset).
# Uses docker-compose.dev.yml (postgres + redis + backend + frontend).

set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose -f docker-compose.dev.yml"

echo "Cleaning old containers..."
$COMPOSE down --volumes --remove-orphans

echo "Removing stuck redis (if exists)..."
docker rm -f finera-redis 2>/dev/null || true

echo "Starting database first..."
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

echo "Running Prisma generate and db push..."
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:password@localhost:5433/finera}"
cd backend-core
npx prisma generate
npx prisma db push
cd "$ROOT"

echo "Starting full system..."
$COMPOSE up --build
