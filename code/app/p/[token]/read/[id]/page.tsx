import Link from "next/link";
import { redirect } from "next/navigation";
import { ReadHeartbeat } from "@/components/ReadHeartbeat";
import { stayByToken } from "@/lib/queries";
import { READ_THRESHOLD_MS } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export default async function BrowseArticlePage({
  params,
}: {
  params: Promise<{ token: string; id: string }>;
}) {
  const { token, id } = await params;
  const stay = await stayByToken(token);
  if (!stay) {
    return (
      <main className="px-6 py-16 text-center">
        <h1 className="text-xl font-bold">码已失效，请找护士</h1>
      </main>
    );
  }
  if (!stay.consentAcceptedAt) redirect(`/p/${token}/consent`);
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) {
    return (
      <main className="px-6 py-10">
        <p>没有这篇文章。</p>
        <Link href={`/p/${token}/center`}>返回</Link>
      </main>
    );
  }
  const task = stay.tasks.find((t) => t.articleId === id && t.status !== "pending");

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white">
      {task ? (
        <ReadHeartbeat token={token} articleId={id} initialDwell={task.dwellMs} threshold={READ_THRESHOLD_MS} />
      ) : null}
      <article className="px-5 py-5">
        <Link href={`/p/${token}/center`} className="text-sm font-medium text-teal">
          返回宣教中心
        </Link>
        <h1 className="mt-3 font-serif text-2xl text-navy">{article.title}</h1>
        <div className="mt-4 whitespace-pre-wrap text-[17px] leading-8 text-slate-800">{article.body}</div>
        {article.mediaUrl ? (
          <p className="mt-4 text-sm">
            音视频：{" "}
            <a className="text-[#1A7A72] underline" href={article.mediaUrl}>
              {article.mediaUrl}
            </a>
          </p>
        ) : null}
        {!task ? (
          <p className="mt-6 text-sm text-slate-500">本篇仅供浏览，不计入待学习有效阅读。</p>
        ) : null}
      </article>
    </div>
  );
}
