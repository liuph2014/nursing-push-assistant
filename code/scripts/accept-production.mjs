import fs from "node:fs";
import path from "node:path";

const envFile = path.join(process.cwd(), ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const PWD = {
  admin: process.env.STAFF_PASSWORD_ADMIN || "admin",
  head: process.env.STAFF_PASSWORD_HEAD,
  li: process.env.STAFF_PASSWORD_LI,
  wang: process.env.STAFF_PASSWORD_WANG,
  zhao: process.env.STAFF_PASSWORD_ZHAO,
  qian: process.env.STAFF_PASSWORD_QIAN,
  nursing: process.env.STAFF_PASSWORD_NURSING,
  qa: process.env.STAFF_PASSWORD_QA,
};

async function login(staffNo, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ staffNo, password }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, cookie, data };
}

async function get(path, cookie) {
  return fetch(`${BASE}${path}`, { headers: cookie ? { cookie } : {}, redirect: "manual" });
}

async function post(path, cookie, body) {
  return fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const fails = [];
function pass(msg) {
  console.log("PASS", msg);
}
function fail(msg) {
  console.log("FAIL", msg);
  fails.push(msg);
}

const ward = await get("/app/ward");
if (ward.status === 307 || ward.status === 302) pass("未登录不能进床位图");
else fail(`未登录床位图 status=${ward.status}`);

const demo = await post("/api/demo/reset");
if (demo.status === 404) pass("演示 reset 接口已关闭");
else fail(`演示 reset status=${demo.status}`);

const head = await login("head", PWD.head);
if (!head.ok) fail("护士长登录");
else pass("护士长登录");

const li = await login("li", PWD.li);
if (!li.ok) fail("李护士登录");
else pass("李护士登录");

const liBed5 = await post("/api/beds/bed-5/apply-pathway", li.cookie, { pathwayId: "path-admit" });
if (liBed5.status === 403) pass("李护士不能套 5 床路径");
else fail(`李护士套 5 床 status=${liBed5.status}`);

const liBed1 = await post("/api/beds/bed-1/apply-pathway", li.cookie, { pathwayId: "path-admit" });
if (liBed1.ok) pass("李护士可套 1 床路径");
else fail(`李护士套 1 床 status=${liBed1.status}`);

const emptyTitle = await post("/api/content", head.cookie, { title: "", body: "x" });
if (emptyTitle.status === 400) pass("空标题不能发布");
else fail(`空标题 status=${emptyTitle.status}`);

const nursing = await login("nursing", PWD.nursing);
const nursingBed = await get("/app/ward/1", nursing.cookie);
const nursingHtml = await nursingBed.text();
if (nursingHtml.includes("张*")) pass("护理部床位页姓名脱敏");
else fail("护理部床位页未脱敏");

const sys = await login("admin", PWD.admin);
if (!sys.ok) fail("系统管理员登录");
else pass("系统管理员登录");
const accountsPage = await get("/app/accounts", sys.cookie);
if (accountsPage.status === 200) pass("系统管理员可进账号权限页");
else fail(`账号权限页 status=${accountsPage.status}`);
const liAccounts = await get("/app/accounts", li.cookie);
if (liAccounts.status === 307 || liAccounts.status === 302 || (await liAccounts.text()).includes("医护登录")) {
  pass("责任护士不能进账号权限页");
} else if (liAccounts.status === 200) fail("责任护士不应看到账号权限页");
else pass("责任护士不能进账号权限页");

const qa = await login("qa", PWD.qa);
const qaPath = await post("/api/pathways/path-admit", qa.cookie, { status: "pending_review" });
if (qaPath.status === 403) pass("质控不能改路径");
else fail(`质控改路径 status=${qaPath.status}`);

const invalid = await get("/p/not-a-token");
const invalidHtml = await invalid.text();
if (invalidHtml.includes("码已失效")) pass("无效床头码提示");
else fail("无效床头码");

console.log(fails.length ? `\n${fails.length} 项未通过` : "\n全部通过");
process.exit(fails.length ? 1 : 0);
