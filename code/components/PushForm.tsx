"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { noteImages } from "@/lib/note";

export function PushForm({
  articles,
  questionnaires,
  tags,
  canWard,
  initialArticleId,
}: {
  articles: { id: string; title: string; summary: string; category: string; keywords: string; mediaType: string; mediaUrl: string }[];
  questionnaires: { id: string; title: string }[];
  tags: { id: string; name: string }[];
  canWard: boolean;
  initialArticleId?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [articleId, setArticleId] = useState(initialArticleId && articles.some((a) => a.id === initialArticleId) ? initialArticleId : articles[0]?.id ?? "");
  const [tagGroupId, setTagGroupId] = useState("");
  const [scope, setScope] = useState<"primary" | "ward">("primary");
  const [schedule, setSchedule] = useState<"now" | "tomorrow">("now");
  const [contentType, setContentType] = useState<"article" | "questionnaire" | "notice">("article");
  const [questionnaireId, setQuestionnaireId] = useState(questionnaires[0]?.id ?? "");
  const [noticeBody, setNoticeBody] = useState("");
  const [msg, setMsg] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return articles;
    return articles.filter((a) => `${a.title} ${a.summary} ${a.category} ${a.keywords}`.toLowerCase().includes(s));
  }, [articles, q]);

  return (
    <form
      className="space-y-4 rounded-xl border bg-white p-4 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setMsg("");
          const payload =
            contentType === "article"
              ? { contentType, articleId, tagGroupId, scope, schedule }
              : contentType === "questionnaire"
                ? { contentType, questionnaireId, tagGroupId, scope, schedule }
                : { contentType, noticeBody, tagGroupId, scope, schedule };
          const res = await fetch("/api/push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = (await res.json().catch(() => ({}))) as { error?: string; preview?: number };
          if (!res.ok) {
            setMsg(data.error || "发送失败");
            return;
          }
          setMsg(`已提交，预计 ${data.preview ?? 0} 人`);
          router.refresh();
        });
      }}
    >
      <div>
        <p className="font-semibold text-[#0F3A5F]">1. 从图文库挑选</p>
        <input
          className="mt-2 w-full rounded border px-2 py-2"
          placeholder="按标题、摘要、话题、检索词筛选"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="mt-2 grid max-h-80 grid-cols-2 gap-2 overflow-auto">
          {filtered.length === 0 ? <p className="col-span-2 text-slate-500">库中没有匹配的图文</p> : null}
          {filtered.map((a) => {
            const cover = noteImages(a.mediaType, a.mediaUrl)[0];
            const on = articleId === a.id && contentType === "article";
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setContentType("article");
                  setArticleId(a.id);
                }}
                className={`overflow-hidden rounded-lg border text-left ${on ? "border-[#FF2442] ring-1 ring-[#FF2442]" : ""}`}
              >
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt="" className="h-24 w-full object-cover" />
                ) : (
                  <div className="flex h-24 items-end bg-[#FFF4E8] p-2 text-xs font-semibold">{a.title}</div>
                )}
                <div className="p-2">
                  <p className="line-clamp-2 text-xs font-medium">{a.title}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{a.category || "未分类"}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="font-semibold text-[#0F3A5F]">2. 筛人并发送</p>
        <label className="mt-2 block">
          标记组
          <select className="mt-1 w-full rounded border px-2 py-1" value={tagGroupId} onChange={(e) => setTagGroupId(e.target.value)}>
            <option value="">不限（当前范围全部床）</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-2 block">
          范围
          <select
            className="mt-1 w-full rounded border px-2 py-1"
            value={scope}
            onChange={(e) => setScope(e.target.value as "primary" | "ward")}
          >
            <option value="primary">仅责任床</option>
            {canWard ? <option value="ward">全科</option> : null}
          </select>
        </label>
        <label className="mt-2 block">
          时机
          <select className="mt-1 w-full rounded border px-2 py-1" value={schedule} onChange={(e) => setSchedule(e.target.value as "now" | "tomorrow")}>
            <option value="now">立即发送</option>
            <option value="tomorrow">明天发送</option>
          </select>
        </label>
      </div>
      <button disabled={pending} className="min-h-12 w-full rounded-lg bg-[#C45C26] text-base font-semibold text-white disabled:opacity-60">
        {pending ? "发送中…" : "发送"}
      </button>
      {msg ? <p className="text-[#1A7A72]">{msg}</p> : null}
      <details className="rounded border bg-slate-50 p-3">
        <summary className="cursor-pointer text-slate-600">改发问卷或纯通知</summary>
        <label className="mt-2 block">
          类型
          <select
            className="mt-1 w-full rounded border px-2 py-1"
            value={contentType}
            onChange={(e) => setContentType(e.target.value as "article" | "questionnaire" | "notice")}
          >
            <option value="article">图文库</option>
            <option value="questionnaire">问卷</option>
            <option value="notice">纯通知</option>
          </select>
        </label>
        {contentType === "questionnaire" ? (
          <select className="mt-2 w-full rounded border px-2 py-1" value={questionnaireId} onChange={(e) => setQuestionnaireId(e.target.value)}>
            {questionnaires.map((qitem) => (
              <option key={qitem.id} value={qitem.id}>
                {qitem.title}
              </option>
            ))}
          </select>
        ) : null}
        {contentType === "notice" ? (
          <textarea className="mt-2 h-20 w-full rounded border px-2 py-1" value={noticeBody} onChange={(e) => setNoticeBody(e.target.value)} placeholder="通知正文" />
        ) : null}
      </details>
    </form>
  );
}
