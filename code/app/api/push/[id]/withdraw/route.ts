import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSession, requireApiSession } from "@/lib/api-session";
import { isReadOnly } from "@/lib/demo";
import { writeAudit } from "@/lib/audit";
import { revalidateNurse } from "@/lib/revalidate";

/** 撤回已发送群发：删除尚未完成（未读完）的任务；已读任务保留但 job 标为 withdrawn */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  if (isReadOnly(role)) return NextResponse.json({ error: "只读角色不能撤回" }, { status: 403 });
  const { id } = await ctx.params;
  const job = await prisma.pushJob.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  if (job.status === "rejected" || job.status === "withdrawn") {
    return NextResponse.json({ error: "该群发已结束，无法再撤回" }, { status: 400 });
  }
  if (role === "primary_nurse") {
    const ownerId = (job as { createdById?: string }).createdById || "";
    if (!ownerId || ownerId !== session.id) {
      return NextResponse.json({ error: "责任护士只能撤回本人发起的推送" }, { status: 403 });
    }
  } else if (role !== "head_nurse") {
    return NextResponse.json({ error: "无权撤回" }, { status: 403 });
  }

  const tasks = await prisma.pushTask.findMany({ where: { jobId: id } });
  const removable = tasks.filter((t) => t.status === "delivered" || t.status === "pending");
  if (removable.length) {
    await prisma.pushTask.deleteMany({ where: { id: { in: removable.map((t) => t.id) } } });
  }
  await prisma.pushJob.update({
    where: { id },
    data: { status: "withdrawn" },
  });
  await writeAudit(role, "撤回群发", id, `移除未读任务 ${removable.length} 条`);
  revalidateNurse();
  return NextResponse.json({ ok: true, removed: removable.length, keptRead: tasks.length - removable.length });
}
