import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSession, requireApiSession } from "@/lib/api-session";
import { canManageTagCatalog } from "@/lib/demo";
import { writeAudit } from "@/lib/audit";
import { revalidateNurse } from "@/lib/revalidate";

const COLORS = ["#C45C26", "#0F3A5F", "#D32F2F", "#1A7A72", "#6A4C93", "#2E7D32", "#1565C0", "#F57C00"];

function nextId() {
  return `tag-${Date.now().toString(36)}`;
}

export async function POST(req: Request) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  if (!canManageTagCatalog(role)) {
    return NextResponse.json({ error: "仅护士长可维护标记组目录" }, { status: 403 });
  }
  const body = (await req.json()) as { name?: string; color?: string };
  const name = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "请填写名称" }, { status: 400 });
  const color = COLORS.includes(body.color || "") ? body.color! : COLORS[0];
  const row = await prisma.tagGroup.create({
    data: { id: nextId(), name, color },
  });
  await writeAudit(role, "新增标记组", row.id, name);
  revalidateNurse();
  return NextResponse.json({ ok: true, id: row.id });
}

export async function PATCH(req: Request) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  if (!canManageTagCatalog(role)) {
    return NextResponse.json({ error: "仅护士长可维护标记组目录" }, { status: 403 });
  }
  const body = (await req.json()) as { id?: string; name?: string; color?: string };
  if (!body.id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  const existing = await prisma.tagGroup.findUnique({ where: { id: body.id } });
  if (!existing) return NextResponse.json({ error: "标记组不存在" }, { status: 404 });
  const name = (body.name ?? existing.name).trim();
  if (!name) return NextResponse.json({ error: "请填写名称" }, { status: 400 });
  const color = body.color && COLORS.includes(body.color) ? body.color : existing.color;
  await prisma.tagGroup.update({ where: { id: body.id }, data: { name, color } });
  await writeAudit(role, "改标记组", body.id, name);
  revalidateNurse();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  if (!canManageTagCatalog(role)) {
    return NextResponse.json({ error: "仅护士长可维护标记组目录" }, { status: 403 });
  }
  let body: { id?: string } = {};
  try {
    body = (await req.json()) as { id?: string };
  } catch {
    return NextResponse.json({ error: "请求无效" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  const plans = await prisma.pushPlan.count({ where: { tagGroupId: body.id } });
  if (plans > 0) {
    return NextResponse.json({ error: "请先在计划页停用或改人群后再删除该标记组" }, { status: 409 });
  }
  const settings = await prisma.educationSettings.findUnique({ where: { id: "demo" } });
  if (settings?.diseaseZoneTagId === body.id) {
    return NextResponse.json({ error: "该组正被专区使用，请先在设置中改回其他组" }, { status: 409 });
  }
  await prisma.stayTag.deleteMany({ where: { tagGroupId: body.id } });
  await prisma.tagGroup.delete({ where: { id: body.id } });
  await writeAudit(role, "删标记组", body.id);
  revalidateNurse();
  return NextResponse.json({ ok: true });
}
