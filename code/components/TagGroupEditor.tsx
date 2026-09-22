"use client";

import { PostButton } from "./PostButton";

export function TagGroupEditor({
  bedId,
  groups,
  selected,
  canEdit,
}: {
  bedId: string;
  groups: { id: string; name: string; color: string }[];
  selected: string[];
  canEdit: boolean;
}) {
  return (
    <div id="tag-groups" className="scroll-mt-28">
      <h2 className="text-lg font-bold text-[#0F3A5F]">标记组</h2>
      <p className="mt-1 text-sm text-slate-500">点色块给本床打标。增删改组名请到「设置 · 标记组管理」（仅护士长）。</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {groups.map((g) => {
          const on = selected.includes(g.id);
          return (
            <PostButton
              key={g.id}
              action={`/api/beds/${bedId}/tags`}
              disabled={!canEdit}
              body={{ tagGroupId: g.id, on: !on }}
              style={on ? { background: g.color, color: "#fff" } : undefined}
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                on ? "" : "bg-white text-slate-700 ring-1 ring-slate-200"
              } disabled:opacity-50`}
            >
              <span
                className="inline-block"
                style={on ? { background: "transparent", color: "inherit" } : undefined}
              >
                {on ? "● " : "○ "}
                {g.name}
              </span>
            </PostButton>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {groups
          .filter((g) => selected.includes(g.id))
          .map((g) => (
            <span key={g.id} className="h-3 w-3 rounded-full" style={{ background: g.color }} title={g.name} />
          ))}
      </div>
    </div>
  );
}
