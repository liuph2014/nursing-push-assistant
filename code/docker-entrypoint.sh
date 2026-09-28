#!/bin/sh
set -e

export USE_PGLITE=0
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-8080}"

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

echo "[entrypoint] starting Next.js on ${HOSTNAME}:${PORT}..."
exec node server.js
