import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSessionToken, SESSION_COOKIE, type SessionPayload } from "./token";

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return readSessionToken(jar.get(SESSION_COOKIE)?.value);
}

export async function requirePageSession() {
  const session = await getSession();
  if (!session) redirect("/app/login");
  return session;
}

export async function getRole() {
  return (await requirePageSession()).role;
}

export async function getActorId() {
  return (await requirePageSession()).id;
}

export async function getSelectedNurseId() {
  return getActorId();
}
