"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ConsultBox({
  token,
  enabled,
  initial,
}: {
  token: string;
  enabled: boolean;
  initial: { id: string; body: string; fromPatient: boolean; createdAt: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  if (!enabled) {
    return <p className="mt-4 rounded-xl bg-slate-100 p-4 text-sm text-slate-600">护士长已关闭出院后问诊/留言功能。</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      <ul className="max-h-80 space-y-2 overflow-auto">
        {initial.length === 0 ? <li className="text-sm text-slate-500">暂无留言。可向病区护士提问。</li> : null}
        {initial.map((m) => (
          <li key={m.id} className={`rounded-xl px-3 py-2 text-sm ${m.fromPatient ? "bg-[#FFF4E8]" : "bg-[#E8F4F2]"}`}>
            <p className="text-[11px] text-slate-400">{m.fromPatient ? "我" : "护士"} · {m.createdAt}</p>
            <p className="mt-0.5 whitespace-pre-wrap">{m.body}</p>
          </li>
        ))}
      </ul>
      <textarea
        className="h-24 w-full rounded border px-3 py-2 text-sm"
        placeholder="留言给护士（出院后仍可发送）"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      <button
        type="button"
        disabled={pending}
        className="w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        onClick={() =>
          start(async () => {
            setErr("");
            const res = await fetch("/api/p/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token, text }),
            });
            const data = (await res.json().catch(() => ({}))) as { error?: string };
            if (!res.ok) {
              setErr(data.error || "发送失败");
              return;
            }
            setText("");
            router.refresh();
          })
        }
      >
        {pending ? "发送中…" : "发送留言"}
      </button>
    </div>
  );
}
