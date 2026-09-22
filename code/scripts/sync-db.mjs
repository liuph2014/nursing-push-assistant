import { execSync } from "node:child_process";

if (process.env.VERCEL || process.env.USE_PGLITE === "0") {
  execSync("npx prisma db push", { stdio: "inherit" });
}
