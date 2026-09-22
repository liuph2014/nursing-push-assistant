import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSession, requireApiSession } from "@/lib/api-session";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  if (role !== "head_nurse") return NextResponse.json({ error: "仅护士长可改计划" }, { status: 403 });
  const { id } = await params;
  const body = (await req.json()) as { enabled?: boolean };
  await prisma.pushPlan.update({ where: { id }, data: { enabled: Boolean(body.enabled) } });
  revalidateNurse();
  return NextResponse.json({ ok: true });
}
