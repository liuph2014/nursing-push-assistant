import { NextResponse } from "next/server";
import { getSession } from "./session";
import type { SessionPayload } from "./token";

export async function requireApiSession(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  return session;
}

export function isSession(value: SessionPayload | NextResponse): value is SessionPayload {
  return !(value instanceof NextResponse);
}
