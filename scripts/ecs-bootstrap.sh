#!/usr/bin/env bash
# 新购/重建香港 ECS 后：在 Workbench 以 root 一键部署
# curl -fsSL https://raw.githubusercontent.com/liuph2014/nursing-push-assistant/main/scripts/ecs-bootstrap.sh | bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/liuph2014/nursing-push-assistant.git}"
APP_DIR="${APP_DIR:-/opt/nursing-push}"
DOMAIN="${DOMAIN:-ininurse.cn}"
# 重建实例后先用 HTTP，二维码可扫；443 放行并签证书后再改 https
APP_URL="${APP_URL:-http://${DOMAIN}}"

export DEBIAN_FRONTEND=noninteractive

echo "==> 基础工具"
apt-get update -y
apt-get install -y ca-certificates curl git openssl

echo "==> 安装 Docker（若尚未安装）"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker
docker version

echo "==> 拉取代码到 ${APP_DIR}"
mkdir -p "$(dirname "$APP_DIR")"
if [ -d "${APP_DIR}/.git" ]; then
  git -C "$APP_DIR" fetch --depth 1 origin main
  git -C "$APP_DIR" reset --hard origin/main
else
  rm -rf "$APP_DIR"
  git clone --depth 1 -b main "$REPO_URL" "$APP_DIR"
fi

# 确保有 git（某些精简镜像没有）
command -v git >/dev/null 2>&1 || apt-get install -y git

cd "${APP_DIR}/deploy"
mkdir -p certbot/www certbot/conf

if [ ! -f .env ]; then
  echo "==> 生成 .env（APP_URL=${APP_URL}）"
  DB_PASS="$(openssl rand -hex 16)"
  AUTH_SECRET="$(openssl rand -hex 32)"
  cat > .env <<EOF
POSTGRES_USER=nursing
POSTGRES_PASSWORD=${DB_PASS}
POSTGRES_DB=nursing
DATABASE_URL=postgresql://nursing:${DB_PASS}@db:5432/nursing?schema=public
NEXT_PUBLIC_APP_URL=${APP_URL}
AUTH_SECRET=${AUTH_SECRET}
READ_THRESHOLD_MS=8000
USE_PGLITE=0
STAFF_PASSWORD_ADMIN=admin
STAFF_PASSWORD_HEAD=head123
STAFF_PASSWORD_LI=li123
STAFF_PASSWORD_WANG=wang123
STAFF_PASSWORD_ZHAO=zhao123
STAFF_PASSWORD_QIAN=qian123
STAFF_PASSWORD_NURSING=nursing123
STAFF_PASSWORD_QA=qa123
EOF
  chmod 600 .env
else
  echo "==> 已存在 .env，跳过生成（如需改 APP_URL 请手工编辑）"
fi

# HTTP 反代（避免无证书时误挂 SSL）
if [ ! -f nginx.conf ] || grep -q 'ssl_certificate' nginx.conf 2>/dev/null; then
  if [ ! -f certbot/conf/live/ininurse.cn/fullchain.pem ]; then
    cat > nginx.conf <<'NGX'
upstream nursing_web {
    server web:3000;
    keepalive 32;
}
server {
    listen 80;
    listen [::]:80;
    server_name ininurse.cn www.ininurse.cn;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        proxy_pass http://nursing_web;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "";
        proxy_read_timeout 60s;
    }
}
NGX
  fi
fi

echo "==> docker compose 构建并启动（首次约 5–15 分钟，1Mbps 带宽更慢）"
docker compose up -d --build

echo "==> 等待服务"
sleep 10
docker compose ps -a
docker compose logs --tail=50 web || true

echo "==> 本机探测"
curl -sS -o /dev/null -w "local_login:%{http_code}\n" http://127.0.0.1/app/login || true
curl -sS -o /dev/null -w "local_join:%{http_code}\n" http://127.0.0.1/p/w/demo-ward || true

echo
echo "========================================"
echo "部署完成（若本机 curl 为 200）"
echo "浏览器打开: ${APP_URL}/app/login"
echo "默认管理员: admin / admin（请尽快改密）"
echo
echo "若外网仍打不开：阿里云安全组务必放行 22/80/443 入站"
echo "HTTPS：安全组放行 443 后执行 scripts/ecs-fix-qr-https.sh"
echo "========================================"
