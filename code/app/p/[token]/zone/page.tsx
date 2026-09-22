import Link from "next/link";
import { redirect } from "next/navigation";
import { stayByToken, getSettings } from "@/lib/queries";
import { prisma } from "@/lib/prisma";

export default async function ZonePage({ params }: { params: Promise<{ token: string }> }) {
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
  const articles = await prisma.article.findMany({
    where: { keywords: { contains: "脑梗死" }, status: "published" },
  });

  return (
    <main className="mx-auto max-w-md px-5 py-6">
      <h1 className="font-serif text-3xl text-navy">{settings.diseaseZoneName}</h1>
      <p className="mt-1 text-sm text-slate-500">护士长配置的专病入口，演示收录带「脑梗死」关键词的文章。</p>
      <ul className="mt-4 space-y-2">
        {articles.map((a) => (
          <li key={a.id}>
            <Link href={`/p/${token}/read/${a.id}`} className="surface block rounded-2xl p-3">
              {a.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
