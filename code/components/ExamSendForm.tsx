"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ExamSendForm({
  questionnaires,
  nurses,
}: {
  questionnaires: { id: string; title: string; isExam: boolean }[];
  nurses: { id: string; name: string; bedsLabel: string }[];
}) {
  const router = useRouter();
  const exams = questionnaires.filter((q) => q.isExam);
  const [qid, setQid] = useState(exams[0]?.id || questionnaires[0]?.id || "");
  const [picked, setPicked] = useState<string[]>(nurses.map((n) => n.id));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  function toggle(id: string) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <form
      className="mt-4 space-y-3 rounded-xl border bg-white p-4 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setMsg("");
          const res = await fetch("/api/exams/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionnaireId: qid, nurseIds: picked }),
          });
          const data = (await res.json().catch(() => ({}))) as { error?: string; sent?: number };
          if (!res.ok) {
            setMsg(data.error || "发送失败");
            return;
          }
          setMsg(`已发给 ${data.sent} 位责任护士（不含答案）`);
          router.refresh();
        });
      }}
    >
      <h2 className="font-bold text-[#0F3A5F]">发送考核</h2>
      <p className="text-xs text-slate-500">勾选要参加的责任护士，一键发送。试卷不含参考答案与分值。</p>
      <select className="w-full rounded border px-2 py-1" value={qid} onChange={(e) => setQid(e.target.value)}>
        {questionnaires.map((q) => (
          <option key={q.id} value={q.id}>
            {q.title}
            {q.isExam ? " · 考核" : " · 问卷"}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="text-xs text-[#1A7A72]" onClick={() => setPicked(nurses.map((n) => n.id))}>
          全选
        </button>
        <button type="button" className="text-xs text-slate-400" onClick={() => setPicked([])}>
          清空
        </button>
      </div>
      <ul className="space-y-1">
        {nurses.map((n) => (
          <li key={n.id}>
            <label className="flex items-center gap-2 rounded border px-2 py-1.5">
              <input type="checkbox" checked={picked.includes(n.id)} onChange={() => toggle(n.id)} />
              <span className="font-medium">{n.name}</span>
              <span className="text-xs text-slate-400">{n.bedsLabel}</span>
            </label>
          </li>
        ))}
      </ul>
      <button disabled={pending} className="w-full rounded-lg bg-[#C45C26] py-2.5 font-semibold text-white disabled:opacity-60">
        {pending ? "发送中…" : "一键发送（不含答案）"}
      </button>
      {msg ? <p className="text-[#1A7A72]">{msg}</p> : null}
    </form>
  );
}
