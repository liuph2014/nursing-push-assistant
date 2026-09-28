#!/usr/bin/env bash
# Run on ECS (Workbench / SSH) to pull latest main and rebuild.
set -euo pipefail
APP_DIR="${APP_DIR:-/opt/nursing-push}"
DOMAIN="${DOMAIN:-ininurse.cn}"

echo "==> backup .env / certbot / nginx.conf"
mkdir -p /tmp/nursing-push-bak
if [ -f "${APP_DIR}/deploy/.env" ]; then
  cp "${APP_DIR}/deploy/.env" /tmp/nursing-push-bak/.env
fi
if [ -d "${APP_DIR}/deploy/certbot" ]; then
  cp -a "${APP_DIR}/deploy/certbot" /tmp/nursing-push-bak/certbot
fi
if [ -f "${APP_DIR}/deploy/nginx.conf" ]; then
  cp "${APP_DIR}/deploy/nginx.conf" /tmp/nursing-push-bak/nginx.conf
fi

echo "==> download latest source"
rm -rf /tmp/nursing-src
mkdir -p /tmp/nursing-src
curl -fsSL "https://codeload.github.com/liuph2014/nursing-push-assistant/tar.gz/refs/heads/main" \
  | tar -xz -C /tmp/nursing-src --strip-components=1

echo "==> replace app tree (preserve nothing under APP_DIR except restored secrets)"
rm -rf "${APP_DIR}.old"
if [ -d "${APP_DIR}" ]; then
  mv "${APP_DIR}" "${APP_DIR}.old"
fi
mkdir -p "${APP_DIR}"
cp -a /tmp/nursing-src/. "${APP_DIR}/"

mkdir -p "${APP_DIR}/deploy/certbot/www" "${APP_DIR}/deploy/certbot/conf"
if [ -f /tmp/nursing-push-bak/.env ]; then
  cp /tmp/nursing-push-bak/.env "${APP_DIR}/deploy/.env"
  chmod 600 "${APP_DIR}/deploy/.env"
elif [ -f "${APP_DIR}.old/deploy/.env" ]; then
  cp "${APP_DIR}.old/deploy/.env" "${APP_DIR}/deploy/.env"
  chmod 600 "${APP_DIR}/deploy/.env"
else
  echo "ERROR: missing deploy/.env" >&2
  exit 1
fi
if [ -d /tmp/nursing-push-bak/certbot ]; then
  cp -a /tmp/nursing-push-bak/certbot/. "${APP_DIR}/deploy/certbot/"
fi
if [ -f /tmp/nursing-push-bak/nginx.conf ]; then
  cp /tmp/nursing-push-bak/nginx.conf "${APP_DIR}/deploy/nginx.conf"
fi

cd "${APP_DIR}/deploy"
docker compose up -d --build
sleep 8
docker compose ps -a
curl -sS -o /dev/null -w "local_login:%{http_code}\n" "http://127.0.0.1/app/login" || true
echo "Done. Open http://${DOMAIN}/app/login (HTTPS if cert already enabled)."
