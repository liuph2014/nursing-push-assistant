import { NextResponse } from "next/server";
import { resetDemoData } from "@/lib/seed";

export async function POST() {
  await resetDemoData();
  return NextResponse.json({ ok: true, tenant: "demo" });
}
