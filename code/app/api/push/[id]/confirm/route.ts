import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSession, requireApiSession } from "@/lib/api-session";
import { materializeJob } from "@/lib/scheduler";
import { writeAudit } from "@/lib/audit";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  if (role !== "head_nurse") return NextResponse.json({ error: "需护士长确认" }, { status: 403 });
  const { id } = await params;
  const job = await prisma.pushJob.findUnique({ where: { id } });
  if (!job || job.status !== "pending_confirm") {
    return NextResponse.json({ error: "没有待确认的群发" }, { status: 400 });
  }
  const sent = await materializeJob(id);
  await writeAudit(role, "确认群发", id, `应发 ${sent}`);
  revalidateNurse();
  return NextResponse.json({ ok: true, sent });
}
