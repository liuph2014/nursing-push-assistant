import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSession, requireApiSession } from "@/lib/api-session";
import { writeAudit } from "@/lib/audit";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST(req: Request) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  if (session.role !== "head_nurse") return NextResponse.json({ error: "仅护士长可增减床位" }, { status: 403 });
  const body = (await req.json()) as { action?: "add" | "remove"; code?: number };
  if (body.action === "add") {
    const max = await prisma.bed.findFirst({ orderBy: { code: "desc" } });
    const code = (max?.code ?? 0) + 1;
    if (code > 40) return NextResponse.json({ error: "演示床位上限 40" }, { status: 400 });
    const id = `bed-${code}`;
    await prisma.bed.create({
      data: {
        id,
        code,
        patientName: "",
        primaryNurseId: null,
      },
    });
    await writeAudit(session.role, "增床", id, `${code} 床`);
    revalidateNurse();
    return NextResponse.json({ ok: true, code });
  }
  if (body.action === "remove") {
    const code = Number(body.code);
    if (!code) return NextResponse.json({ error: "缺少床号" }, { status: 400 });
    const bed = await prisma.bed.findUnique({
      where: { code },
      include: { stay: true },
    });
    if (!bed) return NextResponse.json({ error: "床位不存在" }, { status: 404 });
    if (bed.stay && bed.stay.status === "in_ward") {
      return NextResponse.json({ error: "在院患者床位不可删除，请先出院" }, { status: 409 });
    }
    if (bed.stay) {
      await prisma.pushTask.deleteMany({ where: { stayId: bed.stay.id } });
      await prisma.stayTag.deleteMany({ where: { stayId: bed.stay.id } });
      await prisma.stayPathway.deleteMany({ where: { stayId: bed.stay.id } });
      await prisma.surveyResponse.deleteMany({ where: { stayId: bed.stay.id } });
      await prisma.stay.delete({ where: { id: bed.stay.id } });
    }
    await prisma.bed.delete({ where: { id: bed.id } });
    await writeAudit(session.role, "删床", bed.id, `${code} 床`);
    revalidateNurse();
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
