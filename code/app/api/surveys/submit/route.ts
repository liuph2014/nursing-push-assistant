import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseGrades, parseQuestions, scoreSurvey } from "@/lib/survey";
import { isSession, requireApiSession } from "@/lib/api-session";
import { getActorId, getRole } from "@/lib/session";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    token?: string;
    questionnaireId?: string;
    taskId?: string;
    answers?: Record<string, string | string[]>;
    asExam?: boolean;
    name?: string;
    assignmentId?: string;
  };
  const q = await prisma.questionnaire.findUnique({ where: { id: body.questionnaireId } });
  if (!q) return NextResponse.json({ error: "问卷不存在" }, { status: 404 });
  const questions = parseQuestions(q.questionsJson);
  const grades = parseGrades(q.gradeJson);
  const { score, grade, rawScore, maxScore, detail } = scoreSurvey(questions, body.answers || {}, grades);
  let stayId: string | null = null;
  if (body.token) {
    const stay = await prisma.stay.findUnique({ where: { accessToken: body.token } });
    stayId = stay?.id ?? null;
    if (body.taskId) {
      if (!stay) return NextResponse.json({ error: "无效床头码" }, { status: 404 });
      const task = await prisma.pushTask.findUnique({ where: { id: body.taskId } });
      if (!task || task.stayId !== stay.id || task.questionnaireId !== q.id) {
        return NextResponse.json({ error: "任务与问卷不匹配" }, { status: 400 });
      }
      await prisma.pushTask.update({
        where: { id: body.taskId },
        data: { status: "read", effectiveReadAt: new Date() },
      });
    }
  }

  let nurseId: string | null = null;
  let assignmentId: string | null = body.assignmentId || null;
  let respondentRole = "patient";
  let respondentName = body.name || "患者";

  if (body.assignmentId) {
    const session = await requireApiSession();
    if (!isSession(session)) return session;
    const role = session.role;
    if (role !== "primary_nurse" && role !== "head_nurse") {
      return NextResponse.json({ error: "当前角色不能交考核卷" }, { status: 403 });
    }
    const asg = await prisma.examAssignment.findUnique({ where: { id: body.assignmentId }, include: { nurse: true } });
    if (!asg) return NextResponse.json({ error: "考核任务不存在" }, { status: 404 });
    const myNurse = await getActorId();
    if (role === "primary_nurse" && asg.nurseId !== myNurse) {
      return NextResponse.json({ error: "这不是发给你的试卷" }, { status: 403 });
    }
    if (asg.status === "submitted") {
      return NextResponse.json({ error: "本场考核已交卷" }, { status: 409 });
    }
    nurseId = asg.nurseId;
    assignmentId = asg.id;
    respondentRole = "primary_nurse";
    respondentName = asg.nurse.name;
    await prisma.examAssignment.update({ where: { id: asg.id }, data: { status: "submitted" } });
  } else if (body.asExam) {
    const role = await getRole();
    respondentRole = String(role);
    respondentName = body.name || String(role);
  }

  await prisma.surveyResponse.create({
    data: {
      stayId,
      questionnaireId: q.id,
      taskId: body.taskId,
      answersJson: JSON.stringify(body.answers || {}),
      score,
      grade,
      respondentRole,
      respondentName,
      assignmentId,
      nurseId,
      rawScore,
      maxScore,
      detailJson: JSON.stringify(detail),
    },
  });
  revalidateNurse();
  return NextResponse.json({ ok: true, score, grade, rawScore, maxScore, detail });
}
