import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = "http://localhost:3000";
const OUT = path.resolve(__dirname, "../../产品规格/使用者说明素材");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

fs.mkdirSync(OUT, { recursive: true });

async function hideDevOverlay(page) {
  await page.addStyleTag({
    content: "nextjs-portal, [data-nextjs-dev-overlay] { display: none !important; pointer-events: none !important; }",
  }).catch(() => {});
  await page
    .evaluate(() => {
      document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    })
    .catch(() => {});
}

async function settle(page, ms = 900) {
  await page.waitForLoadState("domcontentloaded");
  await hideDevOverlay(page);
  await page.waitForTimeout(ms);
}

async function shot(page, name) {
  await hideDevOverlay(page);
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, animations: "disabled" });
  console.log("saved", name);
}

async function goto(page, url) {
  await page.goto(BASE + url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await settle(page);
}

async function clickText(page, text) {
  await hideDevOverlay(page);
  await page.getByRole("button", { name: text }).click({ force: true, timeout: 8000 });
}

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--hide-scrollbars", "--disable-gpu"],
  });

  const nurse = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1.5,
    locale: "zh-CN",
  });
  await nurse.addCookies([{ name: "demo-role", value: "head_nurse", url: BASE }]);
  const page = await nurse.newPage();

  const reset = await nurse.request.post(`${BASE}/api/demo/reset`);
  if (!reset.ok()) throw new Error(`reset failed ${reset.status()}`);

  await goto(page, "/app/login");
  await shot(page, "01-login");

  await goto(page, "/app/ward");
  await shot(page, "02-ward");

  await clickText(page, /档案归类/);
  await page.waitForTimeout(400);
  await shot(page, "03-ward-classify");

  await clickText(page, /今日手术 \d+/);
  await page.waitForTimeout(400);
  await shot(page, "04-ward-today-op");

  await clickText(page, "演示工具");
  await page.waitForTimeout(400);
  await shot(page, "05-demo-tools");
  await clickText(page, "收起演示工具");

  const apply = await nurse.request.post(`${BASE}/api/beds/bed-1/apply-pathway`, {
    data: { pathwayId: "path-admit" },
  });
  if (!apply.ok()) {
    console.warn("apply-pathway", apply.status(), await apply.text());
  }

  await goto(page, "/app/ward/1");
  await shot(page, "06-bed");

  await goto(page, "/app/tasks");
  await shot(page, "07-tasks");

  await goto(page, "/app/tasks?tab=bedside");
  await shot(page, "08-tasks-bedside");

  await goto(page, "/app/content");
  await shot(page, "09-content");

  await goto(page, "/app/push");
  await shot(page, "10-push");

  await goto(page, "/app/plans");
  await shot(page, "11-plans");

  await goto(page, "/app/pathways");
  await shot(page, "12-pathways");

  await goto(page, "/app/surveys");
  await shot(page, "13-surveys");

  await goto(page, "/app/stats");
  await shot(page, "14-stats");

  await goto(page, "/app/settings");
  await shot(page, "15-settings");

  await nurse.request.post(`${BASE}/api/demo/role`, { data: { role: "primary_nurse" } });
  await goto(page, "/app/ward");
  await shot(page, "16-ward-primary");

  await nurse.request.post(`${BASE}/api/demo/role`, { data: { role: "nursing_admin" } });
  await goto(page, "/app/stats");
  await shot(page, "17-stats-admin");

  await page.close();
  await nurse.close();

  const patient = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: "zh-CN",
    isMobile: true,
    hasTouch: true,
  });
  const p = await patient.newPage();

  await goto(p, "/p/demo-bed-1-token/consent");
  await shot(p, "18-p-consent");

  const consent = await patient.request.post(`${BASE}/api/p/demo-bed-1-token/consent`);
  if (!consent.ok()) console.warn("consent", consent.status(), await consent.text());

  await goto(p, "/p/demo-bed-1-token/inbox");
  await shot(p, "19-p-inbox");

  await goto(p, "/p/demo-bed-1-token/articles/art-admit");
  await shot(p, "20-p-article");

  await goto(p, "/p/demo-bed-1-token/center");
  await shot(p, "21-p-center");

  await goto(p, "/p/demo-bed-1-token/zone");
  await shot(p, "22-p-zone");

  await goto(p, "/p/not-a-token");
  await shot(p, "23-p-invalid");

  await p.close();
  await patient.close();

  const closer = await browser.newContext();
  await closer.request.post(`${BASE}/api/demo/reset`);
  await closer.close();
  await browser.close();
  console.log("done", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
