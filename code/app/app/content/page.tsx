import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getRole } from "@/lib/session";
import { CiteButton } from "@/components/ArticleEditor";
import { XhsComposer } from "@/components/XhsComposer";
import { NoteFeed } from "@/components/NoteFeed";
import { PageHeader } from "@/components/PageHeader";
import { canWriteLibrary, isReadOnly } from "@/lib/demo";

export default async function ContentPage() {
  const role = await getRole();
  const [articles, categories] = await Promise.all([
    prisma.article.findMany({ include: { category: true }, orderBy: { sortOrder: "desc" } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const writable = canWriteLibrary(role);
  const readonly = isReadOnly(role);
  const isShared = (scope: string) => scope === "public_lib" || scope === "hospital";
  const feed = articles.filter((a) => !isShared(a.scope));
  const publicLib = articles.filter((a) => isShared(a.scope));

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,390px)_1fr]">
      <div>
        <PageHeader
          kicker="宣教"
          title="图文库"
          description={
            writable
              ? "左侧像发笔记：可纯文字，可配图。发布后可点「预览」查看患者端样式，再分发给患者。"
              : "护士长已发布的笔记会出现在这里。可点「预览」，再「分发给患者」。"
          }
        />
        {writable ? (
          <div className="mt-4 lg:sticky lg:top-6">
            <XhsComposer categories={categories} />
          </div>
        ) : null}
      </div>
      <div>
        <h2 className="font-serif text-xl text-navy">本科笔记库</h2>
        <p className="mt-1 text-xs text-slate-500">责任护士按标题、正文或检索词查找，预览后分发给自己的患者。</p>
        <div className="mt-3">
          <Suspense fallback={<p className="text-sm text-slate-500">加载笔记…</p>}>
            <NoteFeed
              notes={feed.map((a) => ({
                id: a.id,
                title: a.title,
                summary: a.summary,
                body: a.body,
                keywords: a.keywords,
                mediaType: a.mediaType,
                mediaUrl: a.mediaUrl,
                status: a.status,
                category: a.category?.name ?? "",
                scope: a.scope,
              }))}
              canDistribute={!readonly}
              canEdit={writable}
            />
          </Suspense>
        </div>
        <section className="mt-8">
          <h3 className="text-sm font-semibold text-slate-500">公共库（引用后才进本科笔记）</h3>
          <p className="mt-1 text-xs text-slate-400">
            来源：院内共享 / 科级示范文（系统预置与护理部发布）。引用后复制为本科笔记，可预览并分发给患者。
          </p>
          {publicLib.length === 0 ? (
            <p className="mt-2 rounded-xl border bg-white px-3 py-4 text-sm text-slate-500">暂无公共库文章。</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {publicLib.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{a.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {a.scope === "hospital" ? "院内共享" : "公共库"} · {a.summary || "可引用到本科"}
                    </p>
                  </div>
                  {writable ? <CiteButton id={a.id} /> : <span className="shrink-0 text-[11px] text-slate-400">请护士长引用</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
