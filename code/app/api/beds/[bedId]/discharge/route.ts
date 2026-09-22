import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSession, requireApiSession } from "@/lib/api-session";
import { canManageBed } from "@/lib/demo";
import { writeAudit } from "@/lib/audit";
import { getDemoNow } from "@/lib/clock";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST(_req: Request, { params }: { params: Promise<{ bedId: string }> }) {
  const { bedId } = await params;
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  const bed = await prisma.bed.findUnique({ where: { id: bedId }, include: { stay: true } });
  if (!bed?.stay) return NextResponse.json({ error: "no bed" }, { status: 404 });
  if (!canManageBed(role, bed.primaryNurseId, session.id)) {
    return NextResponse.json({ error: "没有权限" }, { status: 403 });
  }
  const now = await getDemoNow();
  await prisma.stay.update({
    where: { id: bed.stay.id },
    data: { status: "discharged", dischargedAt: now },
  });
  await writeAudit(role, "出院", `${bed.code}床`);
  revalidateNurse();
  return NextResponse.json({ ok: true });
}
