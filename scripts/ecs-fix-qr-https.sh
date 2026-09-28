#!/usr/bin/env bash
# 修复床头/病区二维码：微信扫 HTTPS 打不开时，先让码指向可用的 HTTP；
# 若本机已能签 Let’s Encrypt，则启用 Nginx SSL（仍需阿里云安全组放行 443）。
set -euo pipefail
cd /opt/nursing-push/deploy

echo "==> 当前公网探测（宿主机）"
curl -sS -o /dev/null -w "local80:%{http_code}\n" http://127.0.0.1/app/login || true

mkdir -p certbot/www certbot/conf

echo "==> 尝试申请/续期证书（走 80 端口 HTTP-01）"
set +e
docker compose --profile cert run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d ininurse.cn -d www.ininurse.cn \
  --email admin@ininurse.cn \
  --agree-tos --no-eff-email --non-interactive \
  --keep-until-expiring
CERT_OK=$?
set -e

if [ -f certbot/conf/live/ininurse.cn/fullchain.pem ]; then
  echo "==> 证书存在，启用 nginx SSL 配置"
  cp -f nginx-ssl.conf.example nginx.conf
  docker compose up -d nginx
  if grep -q '^NEXT_PUBLIC_APP_URL=' .env; then
    sed -i 's|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://ininurse.cn|' .env
  else
    echo 'NEXT_PUBLIC_APP_URL=https://ininurse.cn' >> .env
  fi
  APP_SCHEME=https
else
  echo "==> 证书未就绪，二维码改用 HTTP（微信/浏览器可先打开）"
  if grep -q '^NEXT_PUBLIC_APP_URL=' .env; then
    sed -i 's|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=http://ininurse.cn|' .env
  else
    echo 'NEXT_PUBLIC_APP_URL=http://ininurse.cn' >> .env
  fi
  APP_SCHEME=http
fi

echo "==> 重建 web（床头码写入 APP_URL=${APP_SCHEME}://ininurse.cn）"
docker compose up -d --build web
sleep 6
docker compose ps web nginx
curl -sS -o /dev/null -w "local_login:%{http_code}\n" http://127.0.0.1/app/login || true

echo
echo "完成。请刷新床位详情页，重新查看二维码。"
echo "当前二维码协议: ${APP_SCHEME}://ininurse.cn"
if [ "${APP_SCHEME}" = "https" ]; then
  echo "若手机仍打不开：到阿里云 ECS 安全组放行入站 TCP 443，再试扫码。"
else
  echo "临时使用 HTTP。安全组放行 443 且证书成功后，可再跑本脚本切回 HTTPS。"
fi
echo "试开: ${APP_SCHEME}://ininurse.cn/p/w/demo-ward"
