import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDemoNow } from "@/lib/clock";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const stay = await prisma.stay.findUnique({ where: { accessToken: token } });
  if (!stay) return NextResponse.json({ error: "invalid" }, { status: 404 });
  const body = (await req.json()) as { contactName?: string; contactPhone?: string };
  const now = await getDemoNow();
  await prisma.stay.update({
    where: { id: stay.id },
    data: {
      contactName: body.contactName || stay.contactName,
      contactPhone: body.contactPhone || stay.contactPhone,
      intakeFilledAt: now,
    },
  });
  return NextResponse.json({ ok: true });
}
