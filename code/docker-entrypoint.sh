#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

export USE_PGLITE=0

echo "[entrypoint] prisma db push..."
if [ -x ./node_modules/.bin/prisma ]; then
  ./node_modules/.bin/prisma db push --skip-generate
else
  npx prisma db push --skip-generate
fi

echo "[entrypoint] starting Next.js..."
exec node server.js
