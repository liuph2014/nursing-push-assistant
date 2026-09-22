import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { ACCOUNTS } from "./demo";

const PASSWORD_ENV: Record<string, string> = {
  admin: "STAFF_PASSWORD_ADMIN",
  head: "STAFF_PASSWORD_HEAD",
  li: "STAFF_PASSWORD_LI",
  wang: "STAFF_PASSWORD_WANG",
  zhao: "STAFF_PASSWORD_ZHAO",
  qian: "STAFF_PASSWORD_QIAN",
  nursing: "STAFF_PASSWORD_NURSING",
  qa: "STAFF_PASSWORD_QA",
};

/** 系统管理员默认口令；正式环境请用 STAFF_PASSWORD_ADMIN 覆盖 */
const ADMIN_DEFAULT_PASSWORD = "admin";

export function staffPasswordEnvName(id: string) {
  return PASSWORD_ENV[id] ?? "";
}

export function readStaffPasswords() {
  const missing: string[] = [];
  const passwords: Record<string, string> = {};
  for (const account of ACCOUNTS) {
    const key = PASSWORD_ENV[account.id];
    const value = process.env[key]?.trim();
    if (account.id === "admin") {
      passwords[account.id] = value || ADMIN_DEFAULT_PASSWORD;
      continue;
    }
    if (!value) missing.push(key);
    else passwords[account.id] = value;
  }
  if (missing.length) {
    throw new Error(`缺少口令环境变量：${missing.join(", ")}。请写入 .env，不要写进源码。`);
  }
  return passwords;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 32).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [kind, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const got = scryptSync(password, salt, 32);
  const expect = Buffer.from(hash, "base64url");
  if (got.length !== expect.length) return false;
  return timingSafeEqual(got, expect);
}
