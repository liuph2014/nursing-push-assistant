# 护理推送助手

医护电脑 Web + 患者微信扫码 H5。应用代码在 [`code/`](code/) 目录。

## 本地开发

```bash
cd code
npm install
npm run dev
```

打开 <http://localhost:3000/app/login>。口令见 `code/.env.example`（本地 `.env` 勿提交）。

首次打开空库会自动写入 8 床种子与账号。恢复种子：`npm run db:reset`。

## 对外测试（当前：Vercel + Neon）

1. 访问生产地址：<https://nursing-push-assistant.vercel.app>
2. 用系统管理员登录：工号 `admin`，密码 `admin`
3. 在「账号权限」中为测试同事创建工号与角色，自行设定密码后告知对方
4. 患者端：护士端床位页展示的 HTTPS 床头码，用微信扫开

生产环境变量（Vercel Project Settings → Environment Variables）：

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | Neon Postgres 连接串（`sslmode=require`） |
| `NEXT_PUBLIC_APP_URL` | 生产域名，无末尾斜杠，如 `https://xxx.vercel.app` |
| `AUTH_SECRET` | 会话签名密钥（随机长串） |
| `STAFF_PASSWORD_*` | 首次种子账号口令；对外只发 `admin` |
| `READ_THRESHOLD_MS` | 可选，默认 `8000` |

Root Directory 设为 `code`。Build：`prisma generate && node scripts/sync-db.mjs && next build`（会 `db push`，不会每次清空数据）。

改完 `NEXT_PUBLIC_APP_URL` 后必须再部署一次，床头码才会指向公网 HTTPS。

## 香港 ECS + Docker（推荐中长期 / 未备案）

未 ICP 备案时，用阿里云**中国香港**轻量/ECS + Docker 绑定域名（如 `ininurse.cn`），大陆访问优于 `*.vercel.app`。

编排与步骤见 **[`deploy/README.md`](deploy/README.md)**（含 `Dockerfile`、Compose、Nginx、证书说明）。

## Zeabur 临时试用（免 VPN、接近一键）

给同事先测、尚未备案时，可用 Zeabur（香港/新加坡）从 GitHub 部署。逐步说明见 **[`deploy/zeabur.md`](deploy/zeabur.md)**。

## 测试同事验收清单

- [ ] `admin` 可登录并进入「账号权限」
- [ ] 可新建护士长 / 责任护士并改密登录
- [ ] 护士长可为床位套用入院路径
- [ ] 微信扫床头码可打开患者页，同意后可见待学习
- [ ] 入院须知停留满约 8 秒后，护士端变为已读
- [ ] 防跌倒出现在「当面补讲」，可登记完成
- [ ] 无效码 `/p/not-a-token` 提示找护士
