#!/usr/bin/env bash
# 申请 HTTPS：用 standalone（停 nginx 占 80），只签 ininurse.cn；成功后再开 SSL。
# 失败不影响：可先跑 ecs-force-http-qr.sh 让二维码可用。
set -euo pipefail
cd /opt/nursing-push/deploy
mkdir -p certbot/www certbot/conf

echo "==> 停止 nginx，用 certbot standalone 申请（避免 webroot 404）"
docker compose stop nginx

set +e
docker compose --profile cert run --rm --service-ports certbot certonly \
  --standalone \
  --preferred-challenges http \
  -d ininurse.cn \
  --email admin@ininurse.cn \
  --agree-tos --no-eff-email --non-interactive \
  --keep-until-expiring
CERT_OK=$?
set -e

echo "==> 拉起 nginx"
docker compose up -d nginx

if [ "$CERT_OK" -ne 0 ] || [ ! -f certbot/conf/live/ininurse.cn/fullchain.pem ]; then
  echo "证书申请失败（exit=$CERT_OK）。请先执行："
  echo "  curl -fsSL https://raw.githubusercontent.com/liuph2014/nursing-push-assistant/main/scripts/ecs-force-http-qr.sh | bash"
  exit 1
fi

echo "==> 启用 SSL 配置"
cp -f nginx-ssl.conf.example nginx.conf
# SSL 示例含 www；若无 www 证书，改成仅 apex
sed -i 's/ www.ininurse.cn//g' nginx.conf || true
docker compose up -d nginx

sed -i 's|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://ininurse.cn|' .env
docker compose up -d --build web
sleep 6

echo "证书已启用。请确认阿里云安全组放行 TCP 443，然后刷新床位页二维码。"
curl -sk -o /dev/null -w "local443:%{http_code}\n" https://127.0.0.1/app/login || true
