import Link from "next/link";
import { redirect } from "next/navigation";
import { stayByToken } from "@/lib/queries";

export default async function PatientEntry({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const stay = await stayByToken(token);
  if (!stay) {
    return (
      <main className="px-6 py-16 text-center">
        <h1 className="text-xl font-bold text-[#0F3A5F]">码已失效，请找护士</h1>
        <p className="mt-2 text-slate-600">这不是有效的床头宣教码，或演示数据刚被重置。</p>
      </main>
    );
  }
  if (!stay.consentAcceptedAt) redirect(`/p/${token}/consent`);
  redirect(`/p/${token}/inbox`);
}
