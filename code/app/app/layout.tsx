import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ensureSeed } from "@/lib/ensure-seed";
import { getSession } from "@/lib/session";
import { executeDue } from "@/lib/scheduler";

export const dynamic = "force-dynamic";

export default async function NurseLayout({ children }: { children: React.ReactNode }) {
  await ensureSeed();
  const path = (await headers()).get("x-pathname") ?? "";
  if (path.startsWith("/app/login")) {
    return <div className="min-h-screen">{children}</div>;
  }
  const session = await getSession();
  if (!session) redirect("/app/login");
  try {
    await executeDue();
  } catch (err) {
    console.warn("[scheduler] 到期任务未执行", err);
  }

  return (
    <AppShell role={session.role} name={session.name}>
      {children}
    </AppShell>
  );
}
