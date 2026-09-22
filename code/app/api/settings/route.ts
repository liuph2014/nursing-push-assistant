import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSession, requireApiSession } from "@/lib/api-session";
import { writeAudit } from "@/lib/audit";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST(req: Request) {
  const session = await requireApiSession();
  if (!isSession(session)) return session;
  const role = session.role;
  if (role !== "head_nurse") return NextResponse.json({ error: "仅护士长可改设置" }, { status: 403 });
  const body = (await req.json()) as {
    autoDischargeDays?: number;
    hotline?: string;
    hotlineLabel?: string;
    requireIntakeForm?: boolean;
    requirePushConfirm?: boolean;
    diseaseZoneName?: string;
  };
  await prisma.educationSettings.update({
    where: { id: "demo" },
    data: {
      autoDischargeDays: Number(body.autoDischargeDays) || 30,
      hotline: body.hotline ?? "",
      hotlineLabel: body.hotlineLabel ?? "病区热线",
      requireIntakeForm: Boolean(body.requireIntakeForm),
      requirePushConfirm: Boolean(body.requirePushConfirm),
      diseaseZoneName: body.diseaseZoneName || "脑梗死专区",
    },
  });
  await writeAudit(role, "改宣教设置", "demo");
  revalidateNurse();
  return NextResponse.json({ ok: true });
}
