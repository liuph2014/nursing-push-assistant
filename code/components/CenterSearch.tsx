"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Article = { id: string; title: string; summary: string };

export function CenterSearch({
  token,
  categories,
}: {
  token: string;
  categories: { id: string; name: string; articles: Article[] }[];
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return categories;
    return categories
      .map((c) => ({
        ...c,
        articles: c.articles.filter((a) => `${a.title} ${a.summary}`.toLowerCase().includes(s)),
      }))
      .filter((c) => c.articles.length > 0);
  }, [categories, q]);

  return (
    <div>
      <input
        className="mt-4 w-full rounded-full border bg-white px-4 py-2.5 text-sm shadow-sm"
        placeholder="检索疾病相关知识（标题 / 摘要）"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="mt-4 space-y-4">
        {filtered.length === 0 ? <p className="text-sm text-slate-500">没有匹配内容，试试其他关键词。</p> : null}
        {filtered.map((c) => (
          <section key={c.id}>
            <h2 className="font-semibold text-[#1A7A72]">{c.name}</h2>
            <ul className="mt-1 space-y-2">
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
    </div>
  );
}
