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
  const bed = await prisma.bed.findUnique({ where: { id: bedId }, include: { stay: true } });
  if (!bed?.stay) return NextResponse.json({ error: "no bed" }, { status: 404 });
  if (!canManageBed(role, bed.primaryNurseId, session.id)) {
    return NextResponse.json({ error: "没有权限改标记" }, { status: 403 });
  }
  const body = (await req.json()) as { tagGroupId?: string; on?: boolean };
  if (!body.tagGroupId) return NextResponse.json({ error: "缺少标记组" }, { status: 400 });
  if (body.on) {
    await prisma.stayTag.upsert({
      where: { stayId_tagGroupId: { stayId: bed.stay.id, tagGroupId: body.tagGroupId } },
      create: { stayId: bed.stay.id, tagGroupId: body.tagGroupId },
      update: {},
    });
  } else {
    await prisma.stayTag.deleteMany({
      where: { stayId: bed.stay.id, tagGroupId: body.tagGroupId },
    });
  }
  await writeAudit(role, "改标记组", `${bed.code}床`, body.tagGroupId);
  revalidateNurse();
  return NextResponse.json({ ok: true });
}
