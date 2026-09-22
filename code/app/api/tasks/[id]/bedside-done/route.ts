import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isSession, requireApiSession } from "@/lib/api-session";
import { canManageBed } from "@/lib/demo";
import { writeAudit } from "@/lib/audit";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const { id } = await params;
  const task = await prisma.pushTask.findUnique({ where: { id }, include: { stay: { include: { bed: true } } } });
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!task.bedsideRequired) return NextResponse.json({ error: "该条目不需要当面补讲" }, { status: 400 });
  if (!canManageBed(session.role, task.stay.bed.primaryNurseId, session.id)) {
    return NextResponse.json({ error: "无权完成该床补讲" }, { status: 403 });
  }
  await prisma.pushTask.update({
    where: { id },
    data: { status: "done", bedsideDoneAt: new Date() },
  });
  await writeAudit(session.role, "当面补讲完成", `${task.stay.bed.code}床`);
  revalidatePath("/app/tasks");
  revalidatePath("/app/ward");
  revalidatePath("/app/stats");
  return NextResponse.json({ ok: true });
}
