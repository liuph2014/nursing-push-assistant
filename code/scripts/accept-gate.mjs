/**
 * 本轮验收脚本（无写库副作用）：校验库选择逻辑、SQL 快照、入组/撤回源码契约。
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function assert(cond, msg) {
  if (!cond) failures.push(msg);
  else console.log("OK", msg);
}

const prismaSrc = fs.readFileSync(path.join(root, "lib/prisma.ts"), "utf8");
assert(prismaSrc.includes('USE_PGLITE === "1"'), "prisma: USE_PGLITE=1 才走内嵌库");
assert(!prismaSrc.includes('url.includes("localhost") || url.includes("127.0.0.1")) return false'), "prisma: 不再因 localhost 拒绝 Postgres");
assert(!prismaSrc.includes("127.0.0.1:7719/ingest"), "prisma: 已移除调试上报");

const sql = fs.readFileSync(path.join(root, "prisma/schema.sql"), "utf8");
for (const needle of ["effectiveReadSeconds", "wardJoinToken", "attendingDoctor", "PatientMessage", "createdById"]) {
  assert(sql.includes(needle), `schema.sql 含 ${needle}`);
}

const joinSrc = fs.readFileSync(path.join(root, "app/api/p/ward-join/route.ts"), "utf8");
assert(!joinSrc.includes("pushTask.deleteMany"), "ward-join: 不再 deleteMany PushTask");
assert(joinSrc.includes("!b.stay"), "ward-join: 仅占用无 Stay 的空床");
assert(joinSrc.includes("该床已有出院记录"), "ward-join: 已出院床返回明确错误");

const withdrawSrc = fs.readFileSync(path.join(root, "app/api/push/[id]/withdraw/route.ts"), "utf8");
assert(withdrawSrc.includes("createdById"), "withdraw: 校验 createdById");
assert(withdrawSrc.includes("ownerId !== session.id"), "withdraw: 责任护士非本人 403");

const pushSrc = fs.readFileSync(path.join(root, "app/api/push/route.ts"), "utf8");
assert(pushSrc.includes("createdById: session.id"), "push: 写入 createdById");

if (failures.length) {
  console.error("FAIL\n" + failures.map((f) => "- " + f).join("\n"));
  process.exit(1);
}
console.log("ALL_ACCEPTANCE_CHECKS_PASSED");
