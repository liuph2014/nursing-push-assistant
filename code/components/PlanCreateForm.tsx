"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function PlanCreateForm({
  tags,
  articles,
}: {
  tags: { id: string; name: string }[];
  articles: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    tagGroupId: tags[0]?.id ?? "",
    anchor: "first_scan",
    offsetDays: "0",
    articleId: articles[0]?.id ?? "",
  });

  return (
    <form
      className="mt-4 space-y-2 rounded-xl border bg-white p-4 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setMsg("");
          const res = await fetch("/api/plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, offsetDays: Number(form.offsetDays) || 0 }),
          });
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          if (!res.ok) {
            setMsg(data.error || "创建失败");
            return;
          }
          setMsg("已创建（默认停用，可点启用）");
          setForm({ ...form, name: "" });
          router.refresh();
        });
      }}
    >
      <h3 className="font-semibold text-navy">新建智能计划</h3>
      <input className="w-full rounded border px-2 py-1" placeholder="计划名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <select className="w-full rounded border px-2 py-1" value={form.tagGroupId} onChange={(e) => setForm({ ...form, tagGroupId: e.target.value })}>
        {tags.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <select className="w-full rounded border px-2 py-1" value={form.anchor} onChange={(e) => setForm({ ...form, anchor: e.target.value })}>
        <option value="first_scan">首次扫码</option>
        <option value="admitted">入院日</option>
        <option value="surgery">手术日</option>
        <option value="discharged">出院日</option>
      </select>
      <input
        type="number"
        className="w-full rounded border px-2 py-1"
        placeholder="偏移天数"
        value={form.offsetDays}
        onChange={(e) => setForm({ ...form, offsetDays: e.target.value })}
      />
      <select className="w-full rounded border px-2 py-1" value={form.articleId} onChange={(e) => setForm({ ...form, articleId: e.target.value })}>
        {articles.map((a) => (
          <option key={a.id} value={a.id}>
            {a.title}
          </option>
        ))}
      </select>
      <button disabled={pending} className="w-full rounded-lg bg-[#0F3A5F] py-2 font-semibold text-white disabled:opacity-60">
        {pending ? "创建中…" : "创建计划"}
      </button>
      {msg ? <p className="text-[#1A7A72]">{msg}</p> : null}
    </form>
  );
}
