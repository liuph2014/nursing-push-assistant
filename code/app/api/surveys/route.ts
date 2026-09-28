import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSession, requireApiSession } from "@/lib/api-session";
import { parseQuestions, parseGrades } from "@/lib/survey";
import { writeAudit } from "@/lib/audit";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST(req: Request) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  if (role !== "head_nurse") return NextResponse.json({ error: "仅护士长可编辑试卷" }, { status: 403 });
  const body = (await req.json()) as {
    id?: string;
    title?: string;
    description?: string;
    questionsJson?: string;
    gradeJson?: string;
    isExam?: boolean;
  };
  if (!body.title?.trim()) return NextResponse.json({ error: "请填写试卷标题" }, { status: 400 });
  try {
    parseQuestions(body.questionsJson || "[]");
    parseGrades(body.gradeJson || "[]");
  } catch {
    return NextResponse.json({ error: "题目格式无效" }, { status: 400 });
  }
  const questionsJson = body.questionsJson || "[]";
  const gradeJson =
    body.gradeJson || JSON.stringify([{ min: 80, label: "优秀" }, { min: 60, label: "良好" }, { min: 0, label: "待加强" }]);
  if (body.id) {
    const existing = await prisma.questionnaire.findUnique({ where: { id: body.id } });
    if (!existing) return NextResponse.json({ error: "试卷不存在" }, { status: 404 });
    await prisma.questionnaire.update({
      where: { id: body.id },
      data: {
        title: body.title.trim(),
        description: body.description ?? existing.description,
        questionsJson,
        gradeJson,
        isExam: body.isExam ?? existing.isExam,
      },
    });
    await writeAudit(role, "改试卷", body.id, body.title);
    revalidateNurse();
    return NextResponse.json({ ok: true, id: body.id });
  }
  const created = await prisma.questionnaire.create({
    data: {
      id: `q-${Date.now()}`,
      title: body.title.trim(),
      description: body.description || "",
      questionsJson,
      gradeJson,
      isExam: body.isExam ?? true,
    },
  });
  await writeAudit(role, "新建试卷", created.id, created.title);
  revalidateNurse();
  return NextResponse.json({ ok: true, id: created.id });
}

export async function DELETE(req: Request) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  if (role !== "head_nurse") return NextResponse.json({ error: "仅护士长可删除试卷" }, { status: 403 });
  const body = (await req.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  const existing = await prisma.questionnaire.findUnique({ where: { id: body.id } });
  if (!existing) return NextResponse.json({ error: "试卷不存在" }, { status: 404 });

  const [tasks, jobs, assignments, responses] = await Promise.all([
    prisma.pushTask.count({ where: { questionnaireId: body.id } }),
    prisma.pushJob.count({ where: { questionnaireId: body.id } }),
    prisma.examAssignment.count({ where: { questionnaireId: body.id } }),
    prisma.surveyResponse.count({ where: { questionnaireId: body.id } }),
  ]);
  if (tasks + jobs + assignments + responses > 0) {
    return NextResponse.json(
      { error: "该试卷已有发送或答卷记录，请勿直接删除；可新建试卷替代" },
      { status: 409 },
    );
  }
  await prisma.questionnaire.delete({ where: { id: body.id } });
  await writeAudit(role, "删试卷", body.id, existing.title);
  revalidateNurse();
  return NextResponse.json({ ok: true });
}
