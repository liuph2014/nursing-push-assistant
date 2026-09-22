import { NextResponse } from "next/server";
import { isSession, requireApiSession } from "@/lib/api-session";
import { canManageBed } from "@/lib/demo";
import { prisma } from "@/lib/prisma";
import { applyPathwayToStay } from "@/lib/pathway";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST(req: Request, { params }: { params: Promise<{ bedId: string }> }) {
  const { bedId } = await params;
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  const bed = await prisma.bed.findUnique({ where: { id: bedId }, include: { stay: true } });
  if (!bed?.stay) return NextResponse.json({ error: "床位不存在" }, { status: 404 });
  if (!canManageBed(role, bed.primaryNurseId, session.id)) {
    return NextResponse.json({ error: "当前角色不能给此床套路径" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { pathwayId?: string };
  try {
    await applyPathwayToStay(bed.stay.id, body.pathwayId || "path-admit", role);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "失败";
    return NextResponse.json({ error: msg === "pathway not active" ? "路径尚未启用，请护士长先审核" : "套用失败" }, { status: 400 });
  }
  revalidateNurse();
  return NextResponse.json({ ok: true });
}
