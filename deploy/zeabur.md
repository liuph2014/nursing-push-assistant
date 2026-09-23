# Zeabur 一键部署（国内免 VPN 试访问）

适合：给另一台公网电脑试用；未备案前的过渡方案。正式上线仍建议备案后国内云或香港 ECS（见 [`README.md`](README.md)）。

仓库已配置根目录 [`zbpack.json`](../zbpack.json)：`app_dir` = `code`。

## 1. 打开 Zeabur

1. 打开 <https://zeabur.com> 登录（可用 GitHub 账号）
2. 授权访问仓库 **`liuph2014/nursing-push-assistant`**（私有库需授权）

## 2. 新建项目并加 PostgreSQL

1. **Create Project** → 地域优先选 **Hong Kong** 或 **Singapore**（国内直连通常更好）
2. **Add Service** → **Marketplace / Databases** → 部署 **PostgreSQL**
3. 等数据库变为 Running

## 3. 从 GitHub 部署应用

1. **Add Service** → **GitHub** → 选择 `nursing-push-assistant`
2. 分支：`main`
3. 若未自动读到 `zbpack.json`，在服务设置里把 **Root Directory** 设为 `code`
4. 先不要急着点 Deploy：先配环境变量（下一步）

## 4. 环境变量（应用服务 → Variables）

| 变量名 | 值怎么填 |
| --- | --- |
| `USE_PGLITE` | `0` |
| `DATABASE_URL` | 推荐写成引用（同一项目内 Postgres 服务暴露的变量名以控制台为准），例如：`postgresql://${POSTGRES_USERNAME}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}`；或在变量页用「引用」点选 Connection String。**优先用 Zeabur 自带库**，不必照抄 Vercel 的 Neon 地址 |
| `AUTH_SECRET` | 一长串随机字符（可与 Vercel 相同，或重新生成） |
| `NEXT_PUBLIC_APP_URL` | 先填 Zeabur 给的域名，形如 `https://xxxx.zeabur.app`（**无末尾斜杠**）。域名在服务 **Networking / Domain** 里生成或绑定后再改一次并 **Redeploy** |
| `READ_THRESHOLD_MS` | `8000`（可选） |
| `STAFF_PASSWORD_ADMIN` | `admin`（对外只发这个） |
| `STAFF_PASSWORD_HEAD` | 任意（种子账号用） |
| `STAFF_PASSWORD_LI` | 任意 |
| `STAFF_PASSWORD_WANG` | 任意 |
| `STAFF_PASSWORD_ZHAO` | 任意 |
| `STAFF_PASSWORD_QIAN` | 任意 |
| `STAFF_PASSWORD_NURSING` | 任意 |
| `STAFF_PASSWORD_QA` | 任意 |

说明：构建脚本会执行 `prisma db push`（见 `code/package.json` 的 `build`），因此 **构建期也需要** 有效的 `DATABASE_URL` + `USE_PGLITE=0`。

## 5. 部署与验收

1. 保存变量后 **Deploy / Redeploy**
2. 打开 `https://你的域名.zeabur.app/app/login`
3. 工号 `admin` / 密码 `admin`
4. 用**不开国外 VPN** 的电脑或手机再打开一次，确认能进
5. 在「账号权限」新建数字工号（如 `2211379`）做联调

床头码依赖 `NEXT_PUBLIC_APP_URL`：域名确定后务必改对环境变量并重新部署。

## 6. 以后更新

推送到 GitHub `main`（含 `code/` 下改动）会触发自动部署。若本机 `git push` 仍因 443 失败，可用仓库内 `scripts/push-via-api.mjs`。

## 常见问题

- **Build 失败 / Prisma 连不上库**：检查 `DATABASE_URL` 是否引用了**同一项目**内的 Postgres，且 `USE_PGLITE=0`
- **国内仍打不开**：换项目地域到香港；或回退到 [`deploy/README.md`](README.md) 香港 ECS
- **登录页 404**：路径是 `/app/login`（`/login` 会跳转）
