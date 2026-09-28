import Link from "next/link";
import { redirect } from "next/navigation";
import { stayByToken, getSettings } from "@/lib/queries";
import { prisma } from "@/lib/prisma";

function zoneKeyword(tagName: string) {
  return tagName.replace(/^病种-/, "").trim() || tagName;
}

export default async function ZonePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ z?: string }>;
}) {
  const { token } = await params;
  const { z } = await searchParams;
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
  const tagGroups = await prisma.tagGroup.findMany({ orderBy: { name: "asc" } });
  const diseaseTags = tagGroups.filter((t) => t.name.includes("病种") || t.id === settings.diseaseZoneTagId);
  const zones = diseaseTags.length
    ? diseaseTags.map((t) => ({ id: t.id, name: t.name.replace(/^病种-/, "") + "专区", keyword: zoneKeyword(t.name) }))
    : [{ id: "default", name: settings.diseaseZoneName, keyword: "脑梗死" }];
  const active = zones.find((zone) => zone.keyword === z) || zones[0];
  const articles = await prisma.article.findMany({
    where: { keywords: { contains: active.keyword }, status: "published" },
  });

  return (
    <main className="mx-auto max-w-md px-5 py-6">
      <h1 className="font-serif text-3xl text-navy">{active.name}</h1>
      <p className="mt-1 text-sm text-slate-500">可切换专病专区浏览对应科普。收录关键词：{active.keyword}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {zones.map((zone) => (
          <Link
            key={zone.id}
            href={`/p/${token}/zone?z=${encodeURIComponent(zone.keyword)}`}
            className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ${
              zone.keyword === active.keyword ? "bg-navy text-white ring-navy" : "bg-white text-navy ring-slate-200"
            }`}
          >
            {zone.name}
          </Link>
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {articles.length === 0 ? <li className="text-sm text-slate-500">该专区暂无文章，请护士在图文库补充检索词。</li> : null}
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
