#!/bin/sh
# FinEra - Startup health check for backend
# Waits for backend /health to respond before continuing

URL="${1:-http://localhost:4000/health}"
MAX_ATTEMPTS=${2:-30}
DELAY=${3:-2}

attempt=0
while [ $attempt -lt $MAX_ATTEMPTS ]; do
  if curl -sf "$URL" >/dev/null 2>&1; then
    echo "Backend is ready at $URL"
    exit 0
  fi
  attempt=$((attempt + 1))
  echo "Attempt $attempt/$MAX_ATTEMPTS - Backend not ready"
  [ $attempt -ge $MAX_ATTEMPTS ] && exit 1
  sleep $DELAY
done
exit 1
