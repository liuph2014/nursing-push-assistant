import { NextResponse } from "next/server";
import { STAFF_NURSES } from "@/lib/demo";

export async function POST(req: Request) {
  const body = (await req.json()) as { id?: string };
  if (!body.id || !STAFF_NURSES.some((n) => n.id === body.id)) {
    return NextResponse.json({ error: "无效护士" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, id: body.id });
  res.cookies.set("demo-nurse", body.id, { path: "/", sameSite: "lax" });
  return res;
}
