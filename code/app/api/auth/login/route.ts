import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { sessionCookieOptions, signSession, SESSION_COOKIE } from "@/lib/token";
import { homeForRole } from "@/lib/demo";
import { normalizeStaffId } from "@/lib/staff-id";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { staffNo?: string; password?: string };
  const staffNo = normalizeStaffId(body.staffNo || "");
  const password = body.password || "";
  if (!staffNo || !password) {
    return NextResponse.json({ error: "请填写工号和密码" }, { status: 400 });
  }
  if (!process.env.AUTH_SECRET?.trim()) {
    return NextResponse.json({ error: "服务器未配置 AUTH_SECRET" }, { status: 500 });
  }
  const account = await prisma.staffAccount.findUnique({ where: { id: staffNo } });
  if (!account || !verifyPassword(password, account.passwordHash)) {
    return NextResponse.json({ error: "工号或密码不正确" }, { status: 401 });
  }
  const token = signSession({ id: account.id, role: account.role, name: account.name });
  const res = NextResponse.json({ ok: true, home: homeForRole(account.role) });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
