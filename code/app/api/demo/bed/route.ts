import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = (await req.json()) as { code?: number };
  const code = Number(body.code);
  if (code < 1 || code > 8) {
    return NextResponse.json({ error: "invalid bed" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, code });
  res.cookies.set("demo-bed", String(code), { path: "/", sameSite: "lax" });
  return res;
}
