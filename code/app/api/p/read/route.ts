import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { READ_THRESHOLD_MS } from "@/lib/demo";

const MAX_STEP_MS = 5000;

export async function POST(req: Request) {
  const body = (await req.json()) as {
    token?: string;
    articleId?: string;
  };
  if (!body.token || !body.articleId) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const stay = await prisma.stay.findUnique({
    where: { accessToken: body.token },
    include: { tasks: true },
  });
  if (!stay) return NextResponse.json({ error: "invalid" }, { status: 404 });
  const task = stay.tasks.find((t) => t.articleId === body.articleId && t.status !== "pending");
  if (!task) return NextResponse.json({ error: "no task" }, { status: 404 });
  if (task.status === "done" || task.status === "read") {
    return NextResponse.json({ ok: true, status: task.status, dwellMs: task.dwellMs });
  }

  const now = new Date();
  const gap = task.lastHeartbeatAt ? now.getTime() - task.lastHeartbeatAt.getTime() : 0;
  const addMs = task.lastHeartbeatAt ? Math.min(Math.max(gap, 0), MAX_STEP_MS) : 0;
  const dwellMs = task.dwellMs + addMs;
  const reached = dwellMs >= READ_THRESHOLD_MS;
  const updated = await prisma.pushTask.update({
    where: { id: task.id },
    data: {
      dwellMs,
      lastHeartbeatAt: now,
      status: reached ? "read" : "delivered",
      effectiveReadAt: reached ? now : null,
    },
  });
  if (addMs > 0) {
    await prisma.readEvent.create({
      data: { taskId: task.id, durationMs: addMs },
    });
  }
  revalidatePath("/app/ward");
  revalidatePath("/app/tasks");
  revalidatePath("/app/stats");
  return NextResponse.json({
    ok: true,
    status: updated.status,
    dwellMs: updated.dwellMs,
    threshold: READ_THRESHOLD_MS,
  });
}
