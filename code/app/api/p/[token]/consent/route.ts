import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDemoNow } from "@/lib/clock";
import { executeDue } from "@/lib/scheduler";

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const stay = await prisma.stay.findUnique({ where: { accessToken: token } });
  if (!stay) return NextResponse.json({ error: "invalid" }, { status: 404 });
  const now = await getDemoNow();
  await prisma.stay.update({
    where: { id: stay.id },
    data: {
      consentAcceptedAt: stay.consentAcceptedAt ?? now,
      firstScanAt: stay.firstScanAt ?? now,
    },
  });
  await executeDue();
  return NextResponse.json({ ok: true });
}
