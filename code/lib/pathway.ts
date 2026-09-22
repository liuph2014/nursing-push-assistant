import { prisma } from "./prisma";
import { addDays, getDemoNow } from "./clock";
import { writeAudit } from "./audit";
import type { Role } from "./demo";

export async function applyPathwayToStay(stayId: string, pathwayId: string, role: Role) {
  const stay = await prisma.stay.findUnique({
    where: { id: stayId },
    include: { bed: true, tasks: true },
  });
  const pathway = await prisma.pathway.findUnique({
    where: { id: pathwayId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!stay || !pathway) throw new Error("not found");
  if (pathway.status !== "active") throw new Error("pathway not active");
  const now = await getDemoNow();
  await prisma.stay.update({
    where: { id: stay.id },
    data: { pathwayAppliedAt: now },
  });
  await prisma.stayPathway.upsert({
    where: { stayId_pathwayId: { stayId: stay.id, pathwayId: pathway.id } },
    create: { stayId: stay.id, pathwayId: pathway.id, appliedAt: now },
    update: { appliedAt: now },
  });
  for (const item of pathway.items) {
    const dueAt = addDays(stay.admittedAt ?? now, item.offsetDays);
    const delivered = item.offsetDays <= 0;
    const exists = stay.tasks.some((t) => {
      if (item.articleId && t.articleId === item.articleId) return true;
      if (item.questionnaireId && t.questionnaireId === item.questionnaireId) return true;
      return false;
    });
    if (exists) continue;
    await prisma.pushTask.create({
      data: {
        stayId: stay.id,
        articleId: item.articleId,
        questionnaireId: item.questionnaireId,
        noticeBody: item.noticeBody,
        contentType: item.contentType,
        sourceType: "pathway",
        sourceId: pathway.id,
        status: delivered ? "delivered" : "pending",
        dueAt,
        bedsideRequired: item.bedsideRequired,
        assignedPrimary: Boolean(stay.bed.primaryNurseId),
      },
    });
  }
  await writeAudit(role, "套用路径", `${stay.bed.code}床`, pathway.name);
}
