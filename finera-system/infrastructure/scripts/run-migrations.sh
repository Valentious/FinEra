#!/bin/bash
# FinEra - Run database migrations
# Usage: ./run-migrations.sh

set -e
cd "$(dirname "$0")/../.."
export PGPASSWORD="${POSTGRES_PASSWORD:-finera_secure}"
psql -h localhost -U finera -d finera_db -f database/schema.sql
