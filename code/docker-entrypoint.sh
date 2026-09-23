#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

export USE_PGLITE=0

echo "[entrypoint] prisma db push..."
if [ -f ./node_modules/prisma/build/index.js ]; then
  node ./node_modules/prisma/build/index.js db push --skip-generate
elif [ -x ./node_modules/.bin/prisma ]; then
  ./node_modules/.bin/prisma db push --skip-generate
else
  echo "[entrypoint] prisma CLI missing in image" >&2
  ls -la ./node_modules/prisma 2>/dev/null || true
  ls -la ./node_modules/.bin 2>/dev/null || true
  exit 1
fi

echo "[entrypoint] starting Next.js..."
exec node server.js
