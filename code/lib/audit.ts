import { prisma } from "./prisma";
import type { Role } from "./demo";

export async function writeAudit(actorRole: Role | string, action: string, target: string, detail = "") {
  await prisma.auditLog.create({
    data: { actorRole, action, target, detail },
  });
}
