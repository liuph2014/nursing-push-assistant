import { redirect } from "next/navigation";
import { getRole } from "@/lib/session";
import { homeForRole } from "@/lib/demo";

export default async function NurseHome() {
  const role = await getRole();
  redirect(homeForRole(role));
}
