"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { noteImages } from "@/lib/note";
import { PostButton } from "./PostButton";

export type FeedNote = {
  id: string;
  title: string;
  summary: string;
  body: string;
  keywords: string;
  mediaType: string;
  mediaUrl: string;
  status: string;
  category: string;
  scope: string;
};

function matches(n: FeedNote, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return `${n.title} ${n.summary} ${n.body} ${n.keywords} ${n.category}`.toLowerCase().includes(s);
}

function TextCover({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-[168px] flex-col justify-end bg-gradient-to-br from-[#FFF4E8] to-[#F3EEE8] p-3">
      <p className="text-[15px] font-bold leading-snug text-slate-900">{title}</p>
      <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">{body}</p>
    </div>
  );
}

function NotePreview({ note, onClose }: { note: FeedNote; onClose: () => void }) {
  const imgs = noteImages(note.mediaType, note.mediaUrl);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {imgs.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src.slice(0, 48)}
            src={src}
            alt=""
            className="w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ))}
        <div className="px-5 py-5">
          <p className="text-xs text-slate-400">发布预览 · 患者端阅读样式</p>
          <h2 className="mt-2 font-serif text-2xl leading-snug text-navy">{note.title}</h2>
          <div className="mt-4 whitespace-pre-wrap text-[17px] leading-8 text-slate-800">{note.body}</div>
          <button type="button" className="mt-6 w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-white" onClick={onClose}>
            关闭预览
          </button>
        </div>
      </div>
    </div>
  );
}

export function NoteFeed({
  notes,
  canDistribute,
  canEdit,
}: {
  notes: FeedNote[];
  canDistribute: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [preview, setPreview] = useState<FeedNote | null>(null);
  const filtered = useMemo(() => notes.filter((n) => matches(n, q)), [notes, q]);

  return (
    <div>
      <input
        className="w-full rounded-full border bg-white px-4 py-2.5 text-sm shadow-sm"
        placeholder="搜标题、正文、话题、检索词"
        value={q}
        onChange={(e) => {
          const next = e.target.value;
          setQ(next);
          const params = new URLSearchParams(searchParams.toString());
          if (next.trim()) params.set("q", next.trim());
          else params.delete("q");
          const qs = params.toString();
          router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        }}
      />
      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-slate-500">没有符合的笔记，试试检索词或话题名</p>
      ) : (
        <div className="mt-4 columns-2 gap-3">
          {filtered.map((n) => {
            const imgs = noteImages(n.mediaType, n.mediaUrl);
            return (
              <article key={n.id} className="mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                {imgs[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgs[0]}
                    alt=""
                    className="aspect-[3/4] w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml," +
                        encodeURIComponent(
                          `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect fill="#f1f5f9" width="100%" height="100%"/><text x="50%" y="50%" text-anchor="middle" fill="#94a3b8" font-size="14">图片暂不可用</text></svg>`,
                        );
                    }}
                  />
                ) : (
                  <TextCover title={n.title} body={n.summary || n.body} />
                )}
                <div className="p-2.5">
                  <p className="line-clamp-2 text-sm font-semibold leading-5">{n.title}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    #{n.category || "未分类"}
                    {n.status === "archived" ? " · 已下架" : ""}
                    {imgs.length > 1 ? ` · ${imgs.length} 图` : imgs.length === 0 ? " · 纯文字" : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPreview(n)}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-navy"
                    >
                      预览
                    </button>
                    {canDistribute && n.status === "published" ? (
                      <Link href={`/app/push?article=${n.id}`} className="rounded-full bg-[#FF2442] px-2.5 py-1 text-[11px] font-semibold text-white">
                        分发给患者
                      </Link>
                    ) : null}
                    {canEdit ? (
                      <PostButton
                        action="/api/content"
                        method="DELETE"
                        body={{ id: n.id }}
                        className="text-[11px] text-slate-400"
                      >
                        {n.status === "archived" ? "已下架" : "下架"}
                      </PostButton>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {preview ? <NotePreview note={preview} onClose={() => setPreview(null)} /> : null}
    </div>
  );
}
