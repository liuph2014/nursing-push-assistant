import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSession, requireApiSession } from "@/lib/api-session";
import { writeAudit } from "@/lib/audit";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST(req: Request) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  if (session.role !== "head_nurse") return NextResponse.json({ error: "仅护士长可编辑计划" }, { status: 403 });
  const body = (await req.json()) as {
    name?: string;
    tagGroupId?: string;
    anchor?: string;
    offsetDays?: number;
    articleId?: string;
  };
  if (!body.name?.trim() || !body.tagGroupId || !body.articleId) {
    return NextResponse.json({ error: "请填写名称、标记组与内容" }, { status: 400 });
  }
  const anchor = body.anchor || "first_scan";
  const created = await prisma.pushPlan.create({
    data: {
      id: `plan-${Date.now()}`,
      name: body.name.trim(),
      tagGroupId: body.tagGroupId,
      anchor,
      offsetDays: Number(body.offsetDays) || 0,
      articleId: body.articleId,
      enabled: false,
    },
  });
  await writeAudit(session.role, "新建计划", created.id, created.name);
  revalidateNurse();
  return NextResponse.json({ ok: true, id: created.id });
}
