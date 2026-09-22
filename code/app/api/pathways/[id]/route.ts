import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSession, requireApiSession } from "@/lib/api-session";
import { writeAudit } from "@/lib/audit";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  if (role !== "head_nurse" && role !== "nursing_admin") {
    return NextResponse.json({ error: "仅护士长/护理部可改路径状态" }, { status: 403 });
  }
  const { id } = await params;
  const body = (await req.json()) as { status?: string };
  const status = body.status === "active" ? "active" : "pending_review";
  await prisma.pathway.update({ where: { id }, data: { status } });
  await writeAudit(role, "路径审核", id, status);
  revalidateNurse();
  return NextResponse.json({ ok: true });
}
