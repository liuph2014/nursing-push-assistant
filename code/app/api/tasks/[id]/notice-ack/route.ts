import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSession, requireApiSession } from "@/lib/api-session";
import { canManageBed } from "@/lib/demo";
import { writeAudit } from "@/lib/audit";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const { id } = await params;
  const task = await prisma.pushTask.findUnique({ where: { id }, include: { stay: { include: { bed: true } } } });
  if (!task || task.contentType !== "notice") return NextResponse.json({ error: "没有这条通知" }, { status: 404 });
  if (!canManageBed(session.role, task.stay.bed.primaryNurseId, session.id)) {
    return NextResponse.json({ error: "无权确认该床通知" }, { status: 403 });
  }
  const now = new Date();
  await prisma.pushTask.update({
    where: { id },
    data: { status: "done", noticeAckAt: now },
  });
  await writeAudit(session.role, "通知已告知", `${task.stay.bed.code}床`);
  revalidateNurse();
  return NextResponse.json({ ok: true });
}
