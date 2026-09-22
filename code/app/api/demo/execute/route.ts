import { NextResponse } from "next/server";
import { executeDue } from "@/lib/scheduler";
import { revalidateNurse } from "@/lib/revalidate";

export async function POST() {
  const result = await executeDue();
  revalidateNurse();
  return NextResponse.json({ ok: true, ...result });
}
