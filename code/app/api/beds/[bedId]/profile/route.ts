import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSession, requireApiSession } from "@/lib/api-session";
import { STAFF_NURSES, canManageBed } from "@/lib/demo";
import { writeAudit } from "@/lib/audit";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST(req: Request, ctx: { params: Promise<{ bedId: string }> }) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  const { bedId } = await ctx.params;
  const bed = await prisma.bed.findUnique({ where: { id: bedId } });
  if (!bed) return NextResponse.json({ error: "床位不存在" }, { status: 404 });
  if (!canManageBed(role, bed.primaryNurseId, session.id)) {
    return NextResponse.json({ error: "无权改该床档案" }, { status: 403 });
  }
  const body = (await req.json()) as {
    patientName?: string;
    gender?: string;
    age?: number;
    hospitalNo?: string;
    admittedAt?: string;
    diagnosis?: string;
    nursingLevel?: string;
    dietOrder?: string;
    allergy?: string;
    contactName?: string;
    contactPhone?: string;
    surgeryAt?: string;
    primaryNurseId?: string;
  };
  const stay = await prisma.stay.findUnique({ where: { bedId } });
  if (!stay) return NextResponse.json({ error: "无在院记录" }, { status: 400 });

  const admittedAt = body.admittedAt ? new Date(`${body.admittedAt}T08:00:00`) : stay.admittedAt;
  const surgeryAt = body.surgeryAt ? new Date(`${body.surgeryAt}T08:00:00`) : null;

  await prisma.bed.update({
    where: { id: bedId },
    data: {
      patientName: body.patientName ?? bed.patientName,
      ...(role === "head_nurse" && body.primaryNurseId && STAFF_NURSES.some((n) => n.id === body.primaryNurseId)
        ? { primaryNurseId: body.primaryNurseId }
        : {}),
    },
  });
  await prisma.stay.update({
    where: { id: stay.id },
    data: {
      gender: body.gender ?? stay.gender,
      age: Number.isFinite(body.age) ? Number(body.age) : stay.age,
      hospitalNo: body.hospitalNo ?? stay.hospitalNo,
      admittedAt,
      diagnosis: body.diagnosis ?? stay.diagnosis,
      nursingLevel: body.nursingLevel ?? stay.nursingLevel,
      dietOrder: body.dietOrder ?? stay.dietOrder,
      allergy: body.allergy ?? stay.allergy,
      contactName: body.contactName ?? stay.contactName,
      contactPhone: body.contactPhone ?? stay.contactPhone,
      surgeryAt,
    },
  });
  await writeAudit(role, "改档案", bedId, body.patientName || bed.patientName);
  revalidateNurse();
  return NextResponse.json({ ok: true });
}
