import { createHmac, timingSafeEqual } from "node:crypto";
import { isRole, type Role } from "./demo";

export const SESSION_COOKIE = "nurse-session";
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

export type SessionPayload = {
  id: string;
  role: Role;
  name: string;
  exp: number;
};

function secret() {
  return process.env.AUTH_SECRET?.trim() ?? "";
}

export function signSession(input: { id: string; role: Role; name: string }) {
  const key = secret();
  if (!key) throw new Error("缺少 AUTH_SECRET");
  const payload: SessionPayload = { ...input, exp: Date.now() + MAX_AGE_MS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", key).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readSessionToken(token: string | undefined | null): SessionPayload | null {
  const key = secret();
  if (!token || !key) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expect = createHmac("sha256", key).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (!payload?.id || !isRole(payload.role) || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: (process.env.NEXT_PUBLIC_APP_URL ?? "").startsWith("https://"),
    maxAge: MAX_AGE_MS / 1000,
  };
}
