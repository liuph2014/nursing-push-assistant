import { redirect } from "next/navigation";
import { stayByToken } from "@/lib/queries";
import { IntakeForm } from "@/components/IntakeForm";

export default async function IntakePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const stay = await stayByToken(token);
  if (!stay) {
    return (
      <main className="px-6 py-16 text-center">
        <h1 className="text-xl font-bold">码已失效，请找护士</h1>
      </main>
    );
  }
  if (!stay.consentAcceptedAt) redirect(`/p/${token}/consent`);

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <h1 className="text-2xl font-bold text-[#0F3A5F]">入科信息</h1>
      <p className="mt-2 text-sm text-slate-600">护士长已开启「扫码后必填」，请先留下联系人，再看宣教。</p>
      <IntakeForm token={token} name={stay.contactName} phone={stay.contactPhone} />
    </main>
  );
}
