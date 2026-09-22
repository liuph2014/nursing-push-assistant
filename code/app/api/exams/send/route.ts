import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSession, requireApiSession } from "@/lib/api-session";
import { writeAudit } from "@/lib/audit";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST(req: Request) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  if (role !== "head_nurse") return NextResponse.json({ error: "仅护士长可发送考核" }, { status: 403 });
  const body = (await req.json()) as { questionnaireId?: string; nurseIds?: string[] };
  if (!body.questionnaireId) return NextResponse.json({ error: "请选择试卷" }, { status: 400 });
  const ids = (body.nurseIds || []).filter(Boolean);
  if (!ids.length) return NextResponse.json({ error: "请勾选至少一位责任护士" }, { status: 400 });
  const q = await prisma.questionnaire.findUnique({ where: { id: body.questionnaireId } });
  if (!q) return NextResponse.json({ error: "试卷不存在" }, { status: 404 });
  const nurses = await prisma.staffNurse.findMany({ where: { id: { in: ids } } });
  if (!nurses.length) return NextResponse.json({ error: "未找到责任护士" }, { status: 400 });
  const names: string[] = [];
  const assignmentIds: string[] = [];
  for (const n of nurses) {
    const row = await prisma.examAssignment.create({
      data: {
        questionnaireId: q.id,
        nurseId: n.id,
        sentBy: role,
        status: "pending",
      },
    });
    names.push(n.name);
    assignmentIds.push(row.id);
  }
  await prisma.notification.create({
    data: {
      title: "考核待完成",
      body: `请到「问卷」页作答《${q.title}》。试卷不含答案，提交后自动出分。`,
    },
  });
  await writeAudit(role, "发送考核", q.id, names.join("、"));
  revalidateNurse();
  return NextResponse.json({ ok: true, sent: nurses.length, ids: assignmentIds });
}
