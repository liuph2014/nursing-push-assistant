"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PostButton } from "./PostButton";

const COLORS = [
  { value: "#C45C26", label: "赭" },
  { value: "#0F3A5F", label: "海军" },
  { value: "#D32F2F", label: "红" },
  { value: "#1A7A72", label: "青绿" },
  { value: "#6A4C93", label: "紫" },
  { value: "#2E7D32", label: "绿" },
  { value: "#1565C0", label: "蓝" },
  { value: "#F57C00", label: "橙" },
];

export function TagGroupCatalog({
  groups,
  canEdit,
}: {
  groups: { id: string; name: string; color: string }[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0].value);
  const [err, setErr] = useState("");
  const [edits, setEdits] = useState<Record<string, { name: string; color: string }>>({});

  function draft(g: { id: string; name: string; color: string }) {
    return edits[g.id] ?? { name: g.name, color: g.color };
  }

  return (
    <section className="mt-6 rounded-xl border bg-white p-5">
      <h2 className="font-bold text-[#0F3A5F]">标记组管理</h2>
      <p className="mt-1 text-xs text-slate-500">护士长维护目录。给患者打标仍在床位详情完成。</p>
      <ul className="mt-3 space-y-3">
        {groups.map((g) => {
          const d = draft(g);
          return (
            <li key={g.id} className="flex flex-wrap items-center gap-2 border-b pb-3 text-sm">
              <span className="h-4 w-4 rounded-full" style={{ background: d.color }} />
              {canEdit ? (
                <>
                  <input
                    className="min-w-[8rem] flex-1 rounded border px-2 py-1"
                    value={d.name}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [g.id]: { ...d, name: e.target.value } }))}
                  />
                  <select
                    className="rounded border px-2 py-1"
                    value={d.color}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [g.id]: { ...d, color: e.target.value } }))}
                  >
                    {COLORS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <PostButton
                    action="/api/tag-groups"
                    method="PATCH"
                    body={{ id: g.id, name: d.name, color: d.color }}
                    className="rounded bg-[#0F3A5F] px-2 py-1 text-white"
                  >
                    保存
                  </PostButton>
                  <PostButton
                    action="/api/tag-groups"
                    method="DELETE"
                    body={{ id: g.id }}
                    className="rounded border border-red-200 px-2 py-1 text-red-700"
                  >
                    删除
                  </PostButton>
                </>
              ) : (
                <span>{g.name}</span>
              )}
            </li>
          );
        })}
      </ul>
      {canEdit ? (
        <form
          className="mt-4 flex flex-wrap items-end gap-2 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              setErr("");
              const res = await fetch("/api/tag-groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, color }),
              });
              if (!res.ok) {
                const data = (await res.json().catch(() => ({}))) as { error?: string };
                setErr(data.error || "新增失败");
                return;
              }
              setName("");
              router.refresh();
            });
          }}
        >
          <label>
            新组名称
            <input className="mt-1 block rounded border px-2 py-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="如 吞咽障碍" />
          </label>
          <label>
            颜色
            <select className="mt-1 block rounded border px-2 py-1" value={color} onChange={(e) => setColor(e.target.value)}>
              {COLORS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <button disabled={pending} className="rounded bg-[#C45C26] px-3 py-2 text-white">
            {pending ? "添加中…" : "新增标记组"}
          </button>
          {err ? <p className="w-full text-red-700">{err}</p> : null}
        </form>
      ) : (
        <p className="mt-2 text-sm text-slate-500">仅护士长可增删改目录。</p>
      )}
    </section>
  );
}
