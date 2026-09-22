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
                  <img src={imgs[0]} alt="" className="aspect-[3/4] w-full object-cover" />
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
    </div>
  );
}
