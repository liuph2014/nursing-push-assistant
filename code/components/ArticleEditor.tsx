"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function CiteButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <button
        type="button"
        disabled={pending}
        className="rounded bg-[#1A7A72] px-3 py-1 text-sm text-white disabled:opacity-60"
        onClick={() =>
          start(async () => {
            setErr("");
            setMsg("");
            const res = await fetch("/api/content", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ citeId: id }),
            });
            const data = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
            if (!res.ok) {
              setErr(data.error || "引用失败");
              return;
            }
            setMsg("已引用到本科笔记");
            router.refresh();
          })
        }
      >
        {pending ? "引用中…" : "引用到本科"}
      </button>
      {msg ? <span className="text-[11px] text-[#1A7A72]">{msg}</span> : null}
      {err ? <span className="text-[11px] text-red-600">{err}</span> : null}
    </span>
  );
}
