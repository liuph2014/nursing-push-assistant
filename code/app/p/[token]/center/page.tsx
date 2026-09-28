import Link from "next/link";
import { redirect } from "next/navigation";
import { CenterSearch } from "@/components/CenterSearch";
import { stayByToken } from "@/lib/queries";
import { prisma } from "@/lib/prisma";

export default async function CenterPage({ params }: { params: Promise<{ token: string }> }) {
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
  const categories = await prisma.category.findMany({
    include: { articles: { where: { status: "published", scope: { notIn: ["public_lib", "hospital"] } } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main className="mx-auto max-w-md px-5 py-6">
      <h1 className="font-serif text-3xl text-navy">宣教中心</h1>
      <p className="mt-1 text-sm text-slate-500">
        {stay.status === "discharged" ? "您已出院，仍可检索浏览科普内容（只读）。" : "按分类浏览本科室已发布内容，也可用上方检索查找疾病知识。"}
      </p>
      <CenterSearch
        token={token}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          articles: c.articles.map((a) => ({ id: a.id, title: a.title, summary: a.summary })),
        }))}
      />
    </main>
  );
}
