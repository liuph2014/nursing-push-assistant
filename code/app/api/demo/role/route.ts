import { NextResponse } from "next/server";
import { isRole } from "@/lib/demo";

export async function POST(req: Request) {
  const body = (await req.json()) as { role?: string };
  if (!isRole(body.role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, role: body.role });
  res.cookies.set("demo-role", body.role, { path: "/", sameSite: "lax" });
  return res;
}
