"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function BedManager({ bedCodes }: { bedCodes: number[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const last = bedCodes[bedCodes.length - 1];

  function run(action: "add" | "remove", code?: number) {
    start(async () => {
      setMsg("");
      const res = await fetch("/api/beds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, code }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; code?: number };
      if (!res.ok) {
        setMsg(data.error || "操作失败");
        return;
      }
      setMsg(action === "add" ? `已增加 ${data.code} 床` : `已删除 ${code} 床`);
      router.refresh();
    });
  }

  return (
    <section className="mt-6 rounded-xl border bg-white p-5 text-sm">
      <h2 className="font-bold text-[#0F3A5F]">床位增减</h2>
      <p className="mt-1 text-xs text-slate-500">可增加空床；删除仅限空床或已出院清档后的床。有在院患者时不可删。</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          className="rounded bg-[#0F3A5F] px-3 py-1.5 text-white disabled:opacity-60"
          onClick={() => run("add")}
        >
          增加一床
        </button>
        {last ? (
          <button
            type="button"
            disabled={pending}
            className="rounded border border-red-200 px-3 py-1.5 text-red-700 disabled:opacity-60"
            onClick={() => run("remove", last)}
          >
            删除末床（{last}）
          </button>
        ) : null}
      </div>
      {msg ? <p className="mt-2 text-[#1A7A72]">{msg}</p> : null}
    </section>
  );
}
