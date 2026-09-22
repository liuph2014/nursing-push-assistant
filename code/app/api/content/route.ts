import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSession, requireApiSession } from "@/lib/api-session";
import { canWriteLibrary } from "@/lib/demo";
import { writeAudit } from "@/lib/audit";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST(req: Request) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  if (!canWriteLibrary(role)) return NextResponse.json({ error: "仅护士长可编辑图文库" }, { status: 403 });
  const body = (await req.json()) as {
    id?: string;
    title?: string;
    summary?: string;
    body?: string;
    categoryId?: string;
    keywords?: string;
    scope?: string;
    mediaType?: string;
    mediaUrl?: string;
    citeId?: string;
    archive?: boolean;
  };
  if (body.citeId) {
    const src = await prisma.article.findUnique({ where: { id: body.citeId } });
    if (!src) return NextResponse.json({ error: "公共库文章不存在" }, { status: 404 });
    const created = await prisma.article.create({
      data: {
        id: `art-cite-${Date.now()}`,
        slug: `${src.slug}-cite-${Date.now()}`,
        title: src.title,
        summary: src.summary,
        body: src.body,
        categoryId: src.categoryId,
        keywords: src.keywords,
        scope: "department",
        mediaType: src.mediaType,
        mediaUrl: src.mediaUrl,
        sortOrder: Math.floor(Date.now() / 1000),
        changeLog: `引用公共库 ${src.title}`,
      },
    });
    await writeAudit(role, "引用公共库", created.id);
    revalidateNurse();
    return NextResponse.json({ ok: true, id: created.id });
  }
  const title = (body.title ?? "").trim();
  if (!body.id && !title) return NextResponse.json({ error: "请填写标题" }, { status: 400 });
  if (body.id && body.title !== undefined && !title) return NextResponse.json({ error: "请填写标题" }, { status: 400 });
  if (body.id && body.archive) {
    await prisma.article.update({ where: { id: body.id }, data: { status: "archived" } });
    await writeAudit(role, "下架文章", body.id);
    revalidateNurse();
    return NextResponse.json({ ok: true, archived: true });
  }
  if (body.id) {
    const prev = await prisma.article.findUnique({ where: { id: body.id } });
    const log = [prev?.changeLog, body.title && body.title !== prev?.title ? `改标题为「${body.title}」` : ""]
      .filter(Boolean)
      .join("；");
    await prisma.article.update({
      where: { id: body.id },
      data: {
        title: body.title ?? prev?.title,
        summary: body.summary ?? prev?.summary,
        body: body.body ?? prev?.body,
        categoryId: body.categoryId ?? prev?.categoryId,
        keywords: body.keywords ?? prev?.keywords,
        scope: body.scope ?? prev?.scope,
        mediaType: body.mediaType ?? prev?.mediaType,
        mediaUrl: body.mediaUrl ?? prev?.mediaUrl,
        changeLog: log,
      },
    });
    await writeAudit(role, "改文章", body.id);
  } else {
    const created = await prisma.article.create({
      data: {
        id: `art-${Date.now()}`,
        slug: `a-${Date.now()}`,
        title,
        summary: body.summary || "",
        body: body.body || "",
        sortOrder: Math.floor(Date.now() / 1000),
        categoryId: body.categoryId || null,
        keywords: body.keywords || "",
        scope: body.scope || "department",
        mediaType: body.mediaType || "text",
        mediaUrl: body.mediaUrl || "",
      },
    });
    await writeAudit(role, "新建文章", created.id);
  }
  revalidateNurse();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  if (!canWriteLibrary(role)) return NextResponse.json({ error: "仅护士长可编辑图文库" }, { status: 403 });
  const body = (await req.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  const [items, tasks, plans, jobs] = await Promise.all([
    prisma.pathwayItem.count({ where: { articleId: body.id } }),
    prisma.pushTask.count({ where: { articleId: body.id } }),
    prisma.pushPlan.count({ where: { articleId: body.id } }),
    prisma.pushJob.count({ where: { articleId: body.id } }),
  ]);
  if (items + tasks + plans + jobs > 0) {
    await prisma.article.update({ where: { id: body.id }, data: { status: "archived" } });
    await writeAudit(role, "下架文章", body.id, "仍被路径或任务引用");
    revalidateNurse();
    return NextResponse.json({ ok: true, archived: true });
  }
  await prisma.article.delete({ where: { id: body.id } });
  await writeAudit(role, "删文章", body.id);
  revalidateNurse();
  return NextResponse.json({ ok: true });
}
