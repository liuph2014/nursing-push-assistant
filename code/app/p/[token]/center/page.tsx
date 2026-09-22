import Link from "next/link";
import { redirect } from "next/navigation";
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
    include: { articles: { where: { status: "published", scope: { not: "public_lib" } } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main className="mx-auto max-w-md px-5 py-6">
      <h1 className="font-serif text-3xl text-navy">宣教中心</h1>
      <p className="mt-1 text-sm text-slate-500">按分类浏览本科室已发布内容，不替代护士推给您的待学习。</p>
      <div className="mt-4 space-y-4">
        {categories.map((c) => (
          <section key={c.id}>
            <h2 className="font-semibold text-[#1A7A72]">{c.name}</h2>
            <ul className="mt-1 space-y-2">
              {c.articles.length === 0 ? <li className="text-sm text-slate-400">暂无</li> : null}
              {c.articles.map((a) => (
                <li key={a.id}>
                  <Link href={`/p/${token}/read/${a.id}`} className="surface block rounded-2xl p-3">
                    {a.title}
                    <p className="text-xs text-slate-500">{a.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
