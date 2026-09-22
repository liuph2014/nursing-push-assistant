import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { token?: string; taskId?: string };
  if (!body.token || !body.taskId) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const stay = await prisma.stay.findUnique({ where: { accessToken: body.token } });
  if (!stay) return NextResponse.json({ error: "invalid" }, { status: 404 });
  const task = await prisma.pushTask.findUnique({ where: { id: body.taskId } });
  if (!task || task.stayId !== stay.id || task.contentType !== "notice") {
    return NextResponse.json({ error: "没有这条通知" }, { status: 404 });
  }
  await prisma.pushTask.update({
    where: { id: task.id },
    data: { status: "done", noticeAckAt: new Date() },
  });
  revalidateNurse();
  return NextResponse.json({ ok: true });
}
