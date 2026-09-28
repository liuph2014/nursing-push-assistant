#!/usr/bin/env bash
# 立刻修复床头/病区二维码：不申请证书，强制二维码用 HTTP（当前 443 未通 / ACME 失败时使用）
set -euo pipefail
cd /opt/nursing-push/deploy

echo "==> 将 NEXT_PUBLIC_APP_URL 改为 http://ininurse.cn"
if [ ! -f .env ]; then
  echo "ERROR: missing deploy/.env" >&2
  exit 1
fi
if grep -q '^NEXT_PUBLIC_APP_URL=' .env; then
  sed -i 's|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=http://ininurse.cn|' .env
else
  echo 'NEXT_PUBLIC_APP_URL=http://ininurse.cn' >> .env
fi
grep '^NEXT_PUBLIC_APP_URL=' .env

echo "==> 确保 nginx 当前为 HTTP（避免半吊子 SSL 配置）"
if [ -f nginx.conf ] && grep -q 'ssl_certificate' nginx.conf; then
  if [ ! -f certbot/conf/live/ininurse.cn/fullchain.pem ]; then
    cat > nginx.conf <<'EOF'
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
EOF
  fi
fi

echo "==> 重建并启动 web + nginx"
docker compose up -d --build web
docker compose up -d nginx
sleep 8
docker compose ps web nginx
curl -sS -o /dev/null -w "local_login:%{http_code}\n" http://127.0.0.1/app/login || true
curl -sS -o /dev/null -w "join_http:%{http_code}\n" http://127.0.0.1/p/w/demo-ward || true

echo
echo "完成。请强制刷新床位详情页（Ctrl+F5），二维码应显示 http://ininurse.cn/..."
echo "手机可用浏览器打开: http://ininurse.cn/p/w/demo-ward"
echo "微信若拦截 HTTP，点右上角「在浏览器打开」。"
echo "以后要 HTTPS：安全组放行 443 后，再跑 ecs-fix-qr-https.sh"
