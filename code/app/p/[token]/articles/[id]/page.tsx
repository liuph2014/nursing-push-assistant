import Link from "next/link";
import { redirect } from "next/navigation";
import { ReadHeartbeat } from "@/components/ReadHeartbeat";
import { stayByToken } from "@/lib/queries";
import { READ_THRESHOLD_MS } from "@/lib/demo";
import { noteImages } from "@/lib/note";

export default async function ArticlePage({
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
  const task = stay.tasks.find((t) => t.articleId === id);
  if (!task?.article) {
    return (
      <main className="px-6 py-10">
        <p>没有这篇宣教，请返回待学习或让护士套路径。</p>
        <Link href={`/p/${token}/inbox`} className="mt-4 inline-block text-[#1A7A72]">
          返回
        </Link>
      </main>
    );
  }
  const images = noteImages(task.article.mediaType, task.article.mediaUrl);
  const isAv = task.article.mediaType === "audio" || task.article.mediaType === "video";

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white">
      <ReadHeartbeat
        token={token}
        articleId={id}
        initialDwell={task.dwellMs}
        threshold={READ_THRESHOLD_MS}
      />
      {images.map((src) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt="" className="w-full object-cover" />
      ))}
      <article className="px-5 py-5">
        <Link href={`/p/${token}/inbox`} className="text-sm font-medium text-teal">
          返回待学习
        </Link>
        <h1 className="mt-3 font-serif text-2xl leading-snug text-navy">{task.article.title}</h1>
        <div className="mt-4 whitespace-pre-wrap text-[17px] leading-8 text-slate-800">{task.article.body}</div>
        {isAv && task.article.mediaUrl ? (
          <p className="mt-4 text-sm">
            音视频：{" "}
            <a className="text-[#1A7A72] underline" href={task.article.mediaUrl}>
              {task.article.mediaUrl}
            </a>
          </p>
        ) : null}
      </article>
      <p className="pb-8 text-center text-xs text-slate-400">演示数据</p>
    </div>
  );
}
