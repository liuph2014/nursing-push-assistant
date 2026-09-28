import { WardJoinForm } from "@/components/WardJoinForm";
import { getSettings } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function WardJoinPage({ params }: { params: Promise<{ wardToken: string }> }) {
  const { wardToken } = await params;
  const settings = await getSettings();
  const expected = (settings as { wardJoinToken?: string }).wardJoinToken || "demo-ward";
  if (wardToken !== expected) notFound();

  const beds = await prisma.bed.findMany({ include: { stay: true }, orderBy: { code: "asc" } });
  // 仅从未绑定 Stay 的空床可选；已出院床保留历史不可覆盖
  const emptyBeds = beds.filter((b) => !b.stay).map((b) => b.code);

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white px-5 py-8">
      <p className="text-xs font-semibold tracking-wide text-teal">宣武医院 · 护理推送</p>
      <h1 className="mt-2 font-serif text-3xl text-navy">患者加入病区</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        本码为病区统一入口。请填写基本信息，也可跳过由护士在床位档案中补全。提交后自动分配空床。
      </p>
      <WardJoinForm wardToken={wardToken} emptyBeds={emptyBeds} />
    </main>
  );
}
