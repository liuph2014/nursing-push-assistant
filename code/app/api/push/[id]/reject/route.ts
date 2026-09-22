import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSession, requireApiSession } from "@/lib/api-session";
import { writeAudit } from "@/lib/audit";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  if (role !== "head_nurse") return NextResponse.json({ error: "需护士长驳回" }, { status: 403 });
  const { id } = await params;
  await prisma.pushJob.update({ where: { id }, data: { status: "rejected" } });
  await writeAudit(role, "驳回群发", id);
  revalidateNurse();
  return NextResponse.json({ ok: true });
}
