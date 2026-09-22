import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeDue } from "@/lib/scheduler";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST() {
  const row = await prisma.demoState.upsert({
    where: { id: "demo" },
    update: { dayOffset: { increment: 1 } },
    create: { id: "demo", dayOffset: 1 },
  });
  await executeDue();
  revalidateNurse();
  return NextResponse.json({ ok: true, dayOffset: row.dayOffset });
}
