import { prisma } from "./prisma";
import type { Role } from "./demo";
import { canViewAllBeds } from "./demo";
import { addDays, getDemoNow, startOfDay } from "./clock";

function openEducation(t: { status: string; contentType: string }) {
  return t.status === "delivered" && t.contentType !== "notice";
}

export async function listBeds(role: Role, actorId: string) {
  const beds = await prisma.bed.findMany({
    where: { code: { lte: 8 } },
    orderBy: { code: "asc" },
    include: {
      assignedNurse: true,
      stay: {
        include: {
          tasks: true,
          tags: { include: { tagGroup: true } },
        },
      },
    },
  });
  return beds.map((bed) => {
    const stay = bed.stay;
    const tasks = stay?.tasks ?? [];
    const unread = tasks.filter((t) => openEducation(t)).length;
    const read = tasks.filter((t) => t.contentType !== "notice" && (t.status === "read" || t.status === "done")).length;
    const applied = Boolean(stay?.pathwayAppliedAt);
    const dimmed = role === "primary_nurse" && bed.primaryNurseId !== actorId;
    const discharged = stay?.status === "discharged";
    return {
      ...bed,
      unread,
      read,
      applied,
      dimmed,
      discharged,
      hidden: false,
      viewAll: canViewAllBeds(role),
      tags: stay?.tags.map((t) => t.tagGroup) ?? [],
    };
  });
}

export async function getBedByCode(code: number) {
  const bed = await prisma.bed.findUnique({
    where: { code },
    include: {
      assignedNurse: true,
      stay: {
        include: {
          tasks: { include: { article: true, questionnaire: true } },
          tags: { include: { tagGroup: true } },
          pathways: { include: { pathway: true } },
        },
      },
    },
  });
  if (bed?.stay?.tasks) {
    bed.stay.tasks.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  }
  return bed;
}

export async function listTasks() {
  return prisma.pushTask.findMany({
    include: {
      article: true,
      questionnaire: true,
      stay: { include: { bed: true } },
    },
    orderBy: [{ dueAt: "asc" }],
  });
}

export type StatsRange = "today" | "7" | "30" | "all";

export async function stats(range: StatsRange = "today") {
  const now = await getDemoNow();
  const stays = await prisma.stay.findMany({
    include: { tasks: true, bed: { include: { assignedNurse: true } } },
  });
  const start = startOfDay(now);
  const from =
    range === "today" ? start : range === "7" ? addDays(start, -6) : range === "30" ? addDays(start, -29) : null;
  const newLabel =
    range === "today" ? "今日新增" : range === "7" ? "近7天新增" : range === "30" ? "近30天新增" : "累计新增";
  const census = stays.filter((s) => s.status === "in_ward").length;
  const newCount = stays.filter((s) => s.pathwayAppliedAt && (!from || s.pathwayAppliedAt >= from)).length;
  const inWard = stays.filter((s) => s.status === "in_ward");
  const readPeople = inWard.filter((s) =>
    s.tasks.some((t) => t.contentType !== "notice" && (t.status === "read" || t.status === "done")),
  ).length;
  const unreadPeople = inWard.filter((s) => s.tasks.some((t) => openEducation(t))).length;

  function pack(name: string, rows: typeof stays) {
    const tasks = rows.flatMap((s) => s.tasks);
    const total = tasks.length;
    const closed = tasks.filter((t) => t.status === "read" || t.status === "done").length;
    return {
      name,
      beds: rows.length,
      pushes: total,
      unread: tasks.filter((t) => t.status === "delivered" && t.contentType !== "notice").length,
      coverage: total ? Math.round((closed / total) * 100) : 0,
    };
  }
  const nurseNames = [...new Set(stays.map((s) => s.bed.assignedNurse?.name).filter(Boolean))] as string[];
  const members = nurseNames.map((name) => pack(name, stays.filter((s) => s.bed.assignedNurse?.name === name)));

  const pathStays = stays.filter((s) => s.pathwayAppliedAt);
  let pathDone = 0;
  for (const s of pathStays) {
    const day0 = s.tasks.filter((t) => t.sourceType === "pathway" && t.dueAt <= addDays(s.pathwayAppliedAt!, 0.5));
    const items = day0.length ? day0 : s.tasks.filter((t) => t.sourceType === "pathway");
    if (!items.length) continue;
    const ok = items.every((t) => {
      if (t.status !== "read" && t.status !== "done") return false;
      const doneAt = t.effectiveReadAt ?? t.bedsideDoneAt;
      if (!doneAt || !s.pathwayAppliedAt) return false;
      return doneAt.getTime() - s.pathwayAppliedAt.getTime() <= 24 * 3600 * 1000;
    });
    if (ok) pathDone += 1;
  }

  return {
    census,
    newCount,
    newLabel,
    readPeople,
    unreadPeople,
    members,
    pathTotal: pathStays.length,
    pathDone,
    now,
  };
}

export async function stayByToken(token: string) {
  const stay = await prisma.stay.findUnique({
    where: { accessToken: token },
    include: {
      bed: true,
      tags: { include: { tagGroup: true } },
      tasks: { include: { article: true, questionnaire: true } },
    },
  });
  if (stay?.tasks) stay.tasks.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  return stay;
}

export async function listTagGroups() {
  return prisma.tagGroup.findMany({ orderBy: { name: "asc" } });
}

export async function listArticles() {
  return prisma.article.findMany({
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }],
  });
}

export async function getSettings() {
  return (
    (await prisma.educationSettings.findUnique({ where: { id: "demo" } })) ?? {
      id: "demo",
      autoDischargeDays: 30,
      hotline: "",
      hotlineLabel: "病区热线",
      consultEnabled: false,
      requireIntakeForm: false,
      requirePushConfirm: false,
      consentText: "",
      diseaseZoneName: "脑梗死专区",
      diseaseZoneTagId: "tag-stroke",
    }
  );
}
