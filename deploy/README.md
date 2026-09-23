# 香港 ECS / 轻量应用服务器 + Docker 部署说明

未 ICP 备案时使用**中国香港**地域即可用域名 `ininurse.cn` 对外访问（不要求备案）。大陆备案通过后再迁内地机房。

## 架构

- `db`：Postgres 16（数据卷 `pgdata`）
- `web`：Next.js 生产镜像（`standalone` + 启动时 `prisma db push`）
- `nginx`：80/443 反代到 `web:3000`
- 可选 `certbot` profile：申请 / 续期 Let’s Encrypt 证书

## 1. 云资源

1. 阿里云 → 地域选 **中国香港** → 购买轻量或 ECS（建议 ≥ 2 核 4G，Ubuntu 22.04）
2. 安全组 / 防火墙放行 **22、80、443**
3. 域名解析（DNS）：
   - `ininurse.cn` **A** → 服务器公网 IP
   - `www.ininurse.cn` **A** → 同一 IP  
   TTL 可先设 300 秒，便于回滚

## 2. 服务器准备

```bash
# 安装 Docker（官方脚本示例）
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"
# 重新登录后再用 docker

sudo mkdir -p /opt/nursing-push
# 将本仓库同步到该目录（git clone / scp / rsync 均可）
cd /opt/nursing-push
```

## 3. 配置环境变量

```bash
cd /opt/nursing-push/deploy
cp .env.example .env
nano .env   # 务必改掉 POSTGRES_PASSWORD、AUTH_SECRET；确认 NEXT_PUBLIC_APP_URL=https://ininurse.cn
```

`DATABASE_URL` 中的密码须与 `POSTGRES_PASSWORD` 一致，主机名保持 `db`。

## 4. 首次启动（先 HTTP）

```bash
cd /opt/nursing-push/deploy
docker compose up -d --build
docker compose ps
docker compose logs -f web   # 应看到 prisma db push 与 Next 启动
```

浏览器访问 `http://ininurse.cn/app/login`（证书完成前先用 HTTP 验收也可）。

默认管理员：工号 `admin`，密码见 `.env` 中 `STAFF_PASSWORD_ADMIN`（示例为 `admin`）。

## 5. 申请 HTTPS 证书

DNS 已生效且 80 端口可达后：

```bash
cd /opt/nursing-push/deploy
docker compose --profile cert run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d ininurse.cn -d www.ininurse.cn \
  --email your-email@example.com \
  --agree-tos --no-eff-email
```

启用 SSL 配置：

```bash
cp nginx-ssl.conf.example nginx.conf
docker compose restart nginx
```

再访问 `https://ininurse.cn/app/login`。改过 `NEXT_PUBLIC_APP_URL` 后需重新 `--build` web，床头码才会指向 HTTPS 域名。

## 6. 日常运维

```bash
# 更新代码后
cd /opt/nursing-push
git pull   # 或重新上传
cd deploy
docker compose up -d --build

# 查看日志
docker compose logs -f web nginx

# 备份数据库
docker compose exec db pg_dump -U nursing nursing > backup-$(date +%F).sql

# 证书续期（可 crontab 每月执行）
docker compose --profile cert run --rm certbot renew
docker compose restart nginx
```

## 7. 与 Vercel 切流

1. 香港环境验收通过后，将 `ininurse.cn` A 记录指向香港 IP  
2. 保留 Vercel 项目一段时间作回滚；注意**两边数据库不自动同步**  
3. 若需从 Neon 迁数据：在能访问 Neon 的环境 `pg_dump` / `pg_restore` 到本机 `db` 容器

## 8. 备案后迁大陆（预留）

1. 完成 ICP，购买**内地** ECS +（建议）RDS PostgreSQL  
2. 导出香港库 → 导入 RDS  
3. 修改 `DATABASE_URL`，去掉同机 `db` 服务或仅作备用  
4. DNS 改指内地 IP，更新备案接入

## 目录说明

| 路径 | 说明 |
| --- | --- |
| [`docker-compose.yml`](docker-compose.yml) | 编排 |
| [`.env.example`](.env.example) | 环境变量模板（复制为 `.env`） |
| [`nginx.conf`](nginx.conf) | 默认仅 HTTP + ACME |
| [`nginx-ssl.conf.example`](nginx-ssl.conf.example) | HTTPS 示例 |
| [`../code/Dockerfile`](../code/Dockerfile) | Next 镜像 |
