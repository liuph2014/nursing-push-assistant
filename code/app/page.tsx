import { redirect } from "next/navigation";
import { homeForRole } from "@/lib/demo";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/app/login");
  redirect(homeForRole(session.role));
}
