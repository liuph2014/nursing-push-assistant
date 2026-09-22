import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSession, requireApiSession } from "@/lib/api-session";
import { canManageBed } from "@/lib/demo";
import { writeAudit } from "@/lib/audit";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST(req: Request, { params }: { params: Promise<{ bedId: string }> }) {
  const { bedId } = await params;
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  const from = await prisma.bed.findUnique({ where: { id: bedId }, include: { stay: true } });
  if (!from?.stay) return NextResponse.json({ error: "no bed" }, { status: 404 });
  if (!canManageBed(role, from.primaryNurseId, session.id)) {
    return NextResponse.json({ error: "没有权限" }, { status: 403 });
  }
  const body = (await req.json()) as { toCode?: number };
  const to = await prisma.bed.findUnique({ where: { code: Number(body.toCode) }, include: { stay: true } });
  if (!to) return NextResponse.json({ error: "目标床不存在" }, { status: 404 });
  if (to.stay && to.stay.status !== "discharged") {
    return NextResponse.json({ error: "只能转到已出院的空床" }, { status: 400 });
  }
  const moving = from.stay;
  const fromName = from.patientName;
  const toName = to.patientName;
  if (to.stay) {
    await prisma.stay.update({ where: { id: to.stay.id }, data: { bedId: "bed-temp" } });
    await prisma.stay.update({ where: { id: moving.id }, data: { bedId: to.id } });
    await prisma.stay.update({ where: { id: to.stay.id }, data: { bedId: from.id } });
  } else {
    await prisma.stay.update({ where: { id: moving.id }, data: { bedId: to.id } });
  }
  await prisma.bed.update({ where: { id: from.id }, data: { patientName: toName } });
  await prisma.bed.update({ where: { id: to.id }, data: { patientName: fromName } });
  await writeAudit(role, "转床", `${from.code}床 → ${to.code}床`);
  revalidateNurse();
  return NextResponse.json({ ok: true });
}
