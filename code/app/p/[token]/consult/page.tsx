import Link from "next/link";
import { redirect } from "next/navigation";
import { ConsultBox } from "@/components/ConsultBox";
import { stayByToken, getSettings } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { formatDemoDate } from "@/lib/clock";

export default async function ConsultPage({ params }: { params: Promise<{ token: string }> }) {
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
  const settings = await getSettings();
  const messages = await prisma.patientMessage.findMany({
    where: { stayId: stay.id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return (
    <main className="mx-auto max-w-md px-5 py-6">
      <Link href={`/p/${token}/inbox`} className="text-sm text-teal">
        返回待学习
      </Link>
      <h1 className="mt-3 font-serif text-3xl text-navy">在线问诊 / 留言</h1>
      <p className="mt-1 text-sm text-slate-500">
        {stay.status === "discharged" ? "您已出院，仍可留言；科普可在宣教中心继续查看。" : "住院期间也可向护士留言。"}
      </p>
      <ConsultBox
        token={token}
        enabled={settings.consultEnabled}
        initial={messages.map((m) => ({
          id: m.id,
          body: m.body,
          fromPatient: m.fromPatient,
          createdAt: formatDemoDate(m.createdAt),
        }))}
      />
    </main>
  );
}
