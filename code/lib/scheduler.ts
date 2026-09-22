import { prisma } from "./prisma";
import { writeAudit } from "./audit";
import { addDays, getDemoNow } from "./clock";

type Filter = {
  tagGroupId?: string;
  scope?: "primary" | "ward";
  inWard?: boolean;
  nurseId?: string;
};

export async function matchingStays(filter: Filter) {
  const stays = await prisma.stay.findMany({
    include: { bed: true, tags: true, tasks: true },
  });
  return stays.filter((s) => {
    if (filter.inWard !== false && s.status !== "in_ward") return false;
    if (filter.scope === "primary" && s.bed.primaryNurseId !== filter.nurseId) return false;
    if (filter.tagGroupId && !s.tags.some((t) => t.tagGroupId === filter.tagGroupId)) return false;
    return true;
  });
}

export async function materializeJob(jobId: string) {
  const job = await prisma.pushJob.findUnique({ where: { id: jobId } });
  if (!job) return 0;
  const filter = JSON.parse(job.filterJson || "{}") as Filter;
  const stays = await matchingStays(filter);
  const now = await getDemoNow();
  let sent = 0;
  for (const stay of stays) {
    const dup = stay.tasks.some((t) => {
      if (job.articleId && t.articleId === job.articleId) return true;
      if (job.questionnaireId && t.questionnaireId === job.questionnaireId) return true;
      if (job.noticeBody && t.noticeBody === job.noticeBody && t.sourceId === job.id) return true;
      return false;
    });
    if (dup) continue;
    await prisma.pushTask.create({
      data: {
        stayId: stay.id,
        articleId: job.articleId,
        questionnaireId: job.questionnaireId,
        noticeBody: job.noticeBody,
        contentType: job.contentType,
        sourceType: "manual_job",
        sourceId: job.id,
        jobId: job.id,
        status: "delivered",
        dueAt: now,
        assignedPrimary: Boolean(stay.bed.primaryNurseId),
      },
    });
    sent += 1;
  }
  await prisma.pushJob.update({
    where: { id: job.id },
    data: { status: "sent", statsSent: sent },
  });
  return sent;
}

function anchorOf(
  stay: { admittedAt: Date; surgeryAt: Date | null; dischargedAt: Date | null; firstScanAt: Date | null },
  anchor: string,
) {
  if (anchor === "admitted") return stay.admittedAt;
  if (anchor === "surgery") return stay.surgeryAt;
  if (anchor === "discharged") return stay.dischargedAt;
  return stay.firstScanAt;
}

export async function executeDue() {
  const now = await getDemoNow();
  const settings = await prisma.educationSettings.findUnique({ where: { id: "demo" } });

  const pending = await prisma.pushTask.findMany({
    where: { status: "pending", dueAt: { lte: now } },
  });
  for (const t of pending) {
    await prisma.pushTask.update({ where: { id: t.id }, data: { status: "delivered" } });
  }

  const scheduled = await prisma.pushJob.findMany({
    where: { status: "scheduled", scheduleAt: { lte: now } },
  });
  for (const job of scheduled) {
    await materializeJob(job.id);
  }

  const plans = await prisma.pushPlan.findMany({ where: { enabled: true } });
  const stays = await prisma.stay.findMany({
    include: { bed: true, tags: true, tasks: true },
  });
  for (const plan of plans) {
    for (const stay of stays) {
      if (stay.status !== "in_ward") continue;
      if (!stay.tags.some((t) => t.tagGroupId === plan.tagGroupId)) continue;
      const anchor = anchorOf(stay, plan.anchor);
      if (!anchor) continue;
      const due = addDays(anchor, plan.offsetDays);
      if (due > now) continue;
      if (stay.tasks.some((t) => t.planId === plan.id || t.articleId === plan.articleId)) continue;
      await prisma.pushTask.create({
        data: {
          stayId: stay.id,
          articleId: plan.articleId,
          contentType: "article",
          sourceType: "plan",
          sourceId: plan.id,
          planId: plan.id,
          status: "delivered",
          dueAt: due,
          bedsideRequired: false,
          assignedPrimary: Boolean(stay.bed.primaryNurseId),
        },
      });
    }
    await prisma.pushPlan.update({ where: { id: plan.id }, data: { lastRunAt: now } });
  }

  const unread = await prisma.pushTask.findMany({ where: { status: "delivered" } });
  for (const t of unread) {
    if (t.deliveryCount >= 2) continue;
    if (addDays(t.dueAt, 1) <= now) {
      await prisma.pushTask.update({
        where: { id: t.id },
        data: { deliveryCount: { increment: 1 } },
      });
    }
  }

  const days = settings?.autoDischargeDays ?? 30;
  for (const stay of stays) {
    if (stay.status !== "in_ward") continue;
    if (addDays(stay.admittedAt, days) <= now) {
      await prisma.stay.update({
        where: { id: stay.id },
        data: { status: "discharged", dischargedAt: now },
      });
      await writeAudit("system", "自动出院", stay.id, `住院满 ${days} 天`);
    }
  }

  return { now };
}
