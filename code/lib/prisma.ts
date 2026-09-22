import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaInit?: Promise<PrismaClient>;
};

function useRemotePostgres() {
  if (process.env.VERCEL) return true;
  if (process.env.USE_PGLITE === "0") return true;
  const url = process.env.DATABASE_URL ?? "";
  if (!url) return false;
  if (url.includes("localhost") || url.includes("127.0.0.1")) return false;
  return url.startsWith("postgres");
}

async function migrateStayColumns(pglite: { query: (sql: string) => Promise<{ rows: unknown[] }>; exec: (sql: string) => Promise<unknown> }) {
  const stayCols: [string, string][] = [
    ["gender", "TEXT NOT NULL DEFAULT ''"],
    ["age", "INTEGER NOT NULL DEFAULT 0"],
    ["hospitalNo", "TEXT NOT NULL DEFAULT ''"],
    ["nursingLevel", "TEXT NOT NULL DEFAULT ''"],
    ["dietOrder", "TEXT NOT NULL DEFAULT ''"],
    ["allergy", "TEXT NOT NULL DEFAULT ''"],
  ];
  for (const [name, def] of stayCols) {
    const r = await pglite.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Stay' AND column_name = '${name}'`,
    );
    if (!r.rows.length) {
      await pglite.exec(`ALTER TABLE "Stay" ADD COLUMN "${name}" ${def}`);
    }
  }
  await migrateExamSchema(pglite);
  await migrateAuthSchema(pglite);
}

async function migrateAuthSchema(pglite: { query: (sql: string) => Promise<{ rows: unknown[] }>; exec: (sql: string) => Promise<unknown> }) {
  try {
    await pglite.exec(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'sys_admin'`);
  } catch {
    try {
      await pglite.exec(`ALTER TYPE "Role" ADD VALUE 'sys_admin'`);
    } catch {
      /* enum already has value or dialect differs */
    }
  }
  const account = await pglite.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'StaffAccount'`,
  );
  if (!account.rows.length) {
    await pglite.exec(`
      CREATE TABLE "StaffAccount" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "role" "Role" NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "bedsLabel" TEXT NOT NULL DEFAULT '',
        CONSTRAINT "StaffAccount_pkey" PRIMARY KEY ("id")
      );
    `);
  }
  const nurseCol = await pglite.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Bed' AND column_name = 'primaryNurseId'`,
  );
  if (!nurseCol.rows.length) {
    await pglite.exec(`ALTER TABLE "Bed" ADD COLUMN "primaryNurseId" TEXT`);
    const fk = await pglite.query(
      `SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Bed_primaryNurseId_fkey'`,
    );
    if (!fk.rows.length) {
      await pglite.exec(
        `ALTER TABLE "Bed" ADD CONSTRAINT "Bed_primaryNurseId_fkey" FOREIGN KEY ("primaryNurseId") REFERENCES "StaffAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
      );
    }
  }
  const legacyNurse = await pglite.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Bed' AND column_name = 'primaryNurse'`,
  );
  if (legacyNurse.rows.length) {
    await pglite.exec(`ALTER TABLE "Bed" DROP COLUMN "primaryNurse"`);
  }
  await pglite.exec(`
    UPDATE "Bed" SET "primaryNurseId" = CASE
      WHEN code >= 1 AND code <= 2 THEN 'li'
      WHEN code >= 3 AND code <= 4 THEN 'wang'
      WHEN code >= 5 AND code <= 6 THEN 'zhao'
      WHEN code >= 7 AND code <= 8 THEN 'qian'
      ELSE "primaryNurseId"
    END
    WHERE code <= 8 AND ("primaryNurseId" IS NULL OR "primaryNurseId" = '');
  `);
  const taskCols: [string, string][] = [
    ["bedsideRequired", "BOOLEAN NOT NULL DEFAULT false"],
    ["noticeAckAt", "TIMESTAMP(3)"],
    ["lastHeartbeatAt", "TIMESTAMP(3)"],
  ];
  for (const [name, def] of taskCols) {
    const r = await pglite.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'PushTask' AND column_name = '${name}'`,
    );
    if (!r.rows.length) {
      await pglite.exec(`ALTER TABLE "PushTask" ADD COLUMN "${name}" ${def}`);
    }
  }
}

async function migrateExamSchema(pglite: { query: (sql: string) => Promise<{ rows: unknown[] }>; exec: (sql: string) => Promise<unknown> }) {
  const staff = await pglite.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'StaffNurse'`,
  );
  if (!staff.rows.length) {
    await pglite.exec(`
      CREATE TABLE "StaffNurse" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "title" TEXT NOT NULL DEFAULT '责任护士',
        "bedsLabel" TEXT NOT NULL DEFAULT '',
        CONSTRAINT "StaffNurse_pkey" PRIMARY KEY ("id")
      );
      CREATE TABLE "ExamAssignment" (
        "id" TEXT NOT NULL,
        "questionnaireId" TEXT NOT NULL,
        "nurseId" TEXT NOT NULL,
        "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "sentBy" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        CONSTRAINT "ExamAssignment_pkey" PRIMARY KEY ("id")
      );
      ALTER TABLE "ExamAssignment" ADD CONSTRAINT "ExamAssignment_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "Questionnaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      ALTER TABLE "ExamAssignment" ADD CONSTRAINT "ExamAssignment_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "StaffNurse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    `);
  }
  const respCols: [string, string][] = [
    ["assignmentId", "TEXT"],
    ["nurseId", "TEXT"],
    ["rawScore", "INTEGER NOT NULL DEFAULT 0"],
    ["maxScore", "INTEGER NOT NULL DEFAULT 0"],
    ["detailJson", "TEXT NOT NULL DEFAULT ''"],
  ];
  for (const [name, def] of respCols) {
    const r = await pglite.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'SurveyResponse' AND column_name = '${name}'`,
    );
    if (!r.rows.length) {
      await pglite.exec(`ALTER TABLE "SurveyResponse" ADD COLUMN "${name}" ${def}`);
    }
  }
}

function pgliteDir() {
  const root = process.env.LOCALAPPDATA || process.env.HOME || os.tmpdir();
  return path.join(root, "nursing-demo-pglite");
}

async function createClient(): Promise<PrismaClient> {
  if (useRemotePostgres()) {
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { PrismaPGlite } = await import("pglite-prisma-adapter");
  const dataDir = pgliteDir();
  fs.mkdirSync(dataDir, { recursive: true });
  const pglite = await PGlite.create({ dataDir });

  const check = await pglite.query<{ exists: number }>(
    `SELECT COUNT(*)::int AS exists FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'TagGroup'`,
  );
  if (!check.rows[0]?.exists) {
    await pglite.exec("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
    const sqlPath = path.join(process.cwd(), "prisma", "schema.sql");
    await pglite.exec(fs.readFileSync(sqlPath, "utf8"));
  } else {
    await migrateStayColumns(pglite);
  }

  const factory = new PrismaPGlite(pglite);
  return new PrismaClient({
    adapter: factory as never,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export function getPrisma(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) return Promise.resolve(globalForPrisma.prisma);
  if (!globalForPrisma.prismaInit) {
    globalForPrisma.prismaInit = createClient().then((client) => {
      globalForPrisma.prisma = client;
      return client;
    });
  }
  return globalForPrisma.prismaInit;
}

type AnyFn = (...args: unknown[]) => unknown;

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (prop === "then") return undefined;
    return new Proxy(function noop() {}, {
      get(_t, method: string | symbol) {
        if (method === "then") return undefined;
        return async (...args: unknown[]) => {
          const client = await getPrisma();
          const model = Reflect.get(client, prop) as Record<string | symbol, AnyFn>;
          return model[method](...args);
        };
      },
      apply(_t, _this, args) {
        return getPrisma().then((client) => {
          const fn = Reflect.get(client, prop) as AnyFn;
          return fn.apply(client, args);
        });
      },
    });
  },
});
