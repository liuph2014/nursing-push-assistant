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

// Zeabur image build runs outside the cluster — private Postgres host is unreachable (P1001).
const isZeaburBuild =
  Boolean(process.env.ZEABUR) && process.env.npm_lifecycle_event === "build";

const shouldTry =
  process.env.VERCEL || process.env.ZEABUR || process.env.USE_PGLITE === "0";

if (isZeaburBuild) {
  console.warn(
    "[sync-db] skip prisma db push during Zeabur image build (cluster DB not reachable)",
  );
} else if (shouldTry && canPushDatabase()) {
  execSync("npx prisma db push", { stdio: "inherit" });
} else if (shouldTry) {
  console.warn(
    "[sync-db] skip prisma db push: DATABASE_URL not ready for build/runtime yet",
  );
}
