import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSession, requireApiSession } from "@/lib/api-session";
import { isReadOnly } from "@/lib/demo";
import { getSettings } from "@/lib/queries";
import { matchingStays, materializeJob } from "@/lib/scheduler";
import { addDays, getDemoNow } from "@/lib/clock";
import { writeAudit } from "@/lib/audit";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST(req: Request) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  if (isReadOnly(role)) return NextResponse.json({ error: "只读角色不能群发" }, { status: 403 });
  const body = (await req.json()) as {
    contentType?: string;
    articleId?: string;
    questionnaireId?: string;
    noticeBody?: string;
    tagGroupId?: string;
    scope?: "primary" | "ward";
    schedule?: "now" | "tomorrow";
    stayIds?: string[];
  };
  const settings = await getSettings();
  const scope = body.scope === "ward" ? "ward" : "primary";
  if (scope === "ward" && role !== "head_nurse" && !settings.requirePushConfirm) {
    return NextResponse.json({ error: "责任护士默认只能推责任床；护士长可在设置中打开全科确认闸门" }, { status: 403 });
  }
  const contentType = body.contentType || "article";
  const now = await getDemoNow();
  const stayIds = Array.isArray(body.stayIds) ? body.stayIds.filter((id) => typeof id === "string" && id) : [];
  const filter: {
    tagGroupId: string;
    scope: "primary" | "ward";
    inWard: boolean;
    nurseId: string;
    stayIds: string[];
  } = {
    tagGroupId: body.tagGroupId || "",
    scope,
    inWard: true,
    nurseId: session.id,
    stayIds,
  };

  if (stayIds.length) {
    const allowed = await matchingStays({
      scope,
      inWard: true,
      nurseId: session.id,
      stayIds: undefined,
    });
    const allowedSet = new Set(allowed.map((s) => s.id));
    const invalid = stayIds.filter((id) => !allowedSet.has(id));
    if (invalid.length) {
      return NextResponse.json({ error: "所选患者超出可推送范围" }, { status: 403 });
    }
  }

  const scheduleAt = body.schedule === "tomorrow" ? addDays(now, 1) : null;
  const needsConfirm = scope === "ward" && settings.requirePushConfirm && role === "primary_nurse";
  let status = "sent";
  if (needsConfirm) status = "pending_confirm";
  else if (scheduleAt) status = "scheduled";

  const job = await prisma.pushJob.create({
    data: {
      contentType,
      articleId: contentType === "article" ? body.articleId : null,
      questionnaireId: contentType === "questionnaire" ? body.questionnaireId : null,
      noticeBody: contentType === "notice" ? body.noticeBody || "" : "",
      filterJson: JSON.stringify(filter),
      scheduleAt,
      status,
      createdBy: role,
      createdById: session.id,
    },
  });

  if (status === "sent") {
    const sent = await materializeJob(job.id);
    await writeAudit(role, "群发", job.id, `应发 ${sent}`);
  } else if (status === "scheduled") {
    await writeAudit(role, "定时群发", job.id);
  } else {
    await writeAudit(role, "群发待确认", job.id);
  }
  revalidateNurse();
  return NextResponse.json({ ok: true, id: job.id, status, preview: (await matchingStays(filter)).length });
}
