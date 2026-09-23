import { execSync } from "node:child_process";

function canPushDatabase() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url || url.includes("${")) return false;
  try {
    const parsed = new URL(url);
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

const shouldTry =
  process.env.VERCEL || process.env.ZEABUR || process.env.USE_PGLITE === "0";

if (shouldTry && canPushDatabase()) {
  execSync("npx prisma db push", { stdio: "inherit" });
} else if (shouldTry) {
  console.warn("[sync-db] skip prisma db push: DATABASE_URL not ready for build/runtime yet");
}
