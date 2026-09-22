"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { GradeBand, Question } from "@/lib/survey";

const DEFAULT_GRADES: GradeBand[] = [
  { min: 80, label: "优秀" },
  { min: 60, label: "良好" },
  { min: 0, label: "待加强" },
];

function qid() {
  return `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

const emptySingle = (): Question => ({
  id: qid(),
  prompt: "",
  type: "single",
  options: [
    { id: "a", label: "", score: 2 },
    { id: "b", label: "", score: 0 },
  ],
});

export function QuestionEditor({
  initial,
}: {
  initial?: {
    id: string;
    title: string;
    description: string;
    questionsJson: string;
    gradeJson: string;
    isExam: boolean;
  };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isExam, setIsExam] = useState(initial?.isExam ?? true);
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const parsed = JSON.parse(initial?.questionsJson || "[]") as Question[];
      return parsed.length ? parsed : [emptySingle()];
    } catch {
      return [emptySingle()];
    }
  });
  const [msg, setMsg] = useState("");

  function patch(i: number, next: Partial<Question>) {
    setQuestions((list) => list.map((q, idx) => (idx === i ? { ...q, ...next } : q)));
  }

  function patchOpt(qi: number, oi: number, next: Partial<Question["options"][0]>) {
    setQuestions((list) =>
      list.map((q, idx) =>
        idx === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? { ...o, ...next } : o)) } : q,
      ),
    );
  }

  return (
    <form
      className="space-y-3 rounded-xl border bg-white p-4 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setMsg("");
          const res = await fetch("/api/surveys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: initial?.id,
              title,
              description,
              isExam,
              questionsJson: JSON.stringify(questions),
              gradeJson: JSON.stringify(DEFAULT_GRADES),
            }),
          });
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          if (!res.ok) {
            setMsg(data.error || "保存失败");
            return;
          }
          setMsg("试卷已保存，可在下方勾选责任护士发送");
          router.refresh();
        });
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[#0F3A5F]">{initial ? "编辑试卷" : "新建试卷（问卷星式）"}</h2>
        <label className="flex items-center gap-1 text-xs">
          <input type="checkbox" checked={isExam} onChange={(e) => setIsExam(e.target.checked)} />
          用于护士考核
        </label>
      </div>
      <input className="w-full rounded border px-2 py-1.5" placeholder="试卷标题" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className="w-full rounded border px-2 py-1.5" placeholder="说明（考生可见，不含答案）" value={description} onChange={(e) => setDescription(e.target.value)} />
      {questions.map((q, i) => (
        <div key={q.id} className="rounded-lg border border-slate-200 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">第 {i + 1} 题</span>
            <select
              className="rounded border px-1 py-0.5 text-xs"
              value={q.type}
              onChange={(e) => {
                const type = e.target.value as Question["type"];
                if (type === "text") patch(i, { type, options: [], textAnswer: q.textAnswer || "", textScore: q.textScore ?? 2 });
                else patch(i, { type, options: q.options.length ? q.options : emptySingle().options });
              }}
            >
              <option value="single">单选</option>
              <option value="multiple">多选</option>
              <option value="text">填空</option>
            </select>
            <button type="button" className="ml-auto text-xs text-red-600" onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))}>
              删除题
            </button>
          </div>
          <input
            className="mt-2 w-full rounded border px-2 py-1"
            placeholder="题干"
            value={q.prompt}
            onChange={(e) => patch(i, { prompt: e.target.value })}
          />
          {q.type === "text" ? (
            <div className="mt-2 grid grid-cols-3 gap-2">
              <input
                className="col-span-2 rounded border px-2 py-1"
                placeholder="参考答案关键词，逗号分隔（不发给考生）"
                value={q.textAnswer || ""}
                onChange={(e) => patch(i, { textAnswer: e.target.value })}
              />
              <input
                type="number"
                className="rounded border px-2 py-1"
                placeholder="分值"
                value={q.textScore ?? 0}
                onChange={(e) => patch(i, { textScore: Number(e.target.value) || 0 })}
              />
            </div>
          ) : (
            <ul className="mt-2 space-y-1">
              {q.options.map((o, oi) => (
                <li key={o.id} className="flex gap-2">
                  <input
                    className="flex-1 rounded border px-2 py-1"
                    placeholder={`选项 ${o.id}`}
                    value={o.label}
                    onChange={(e) => patchOpt(i, oi, { label: e.target.value })}
                  />
                  <input
                    type="number"
                    className="w-16 rounded border px-1 py-1"
                    title="正确答案给正分，干扰项填 0"
                    value={o.score}
                    onChange={(e) => patchOpt(i, oi, { score: Number(e.target.value) || 0 })}
                  />
                  <button
                    type="button"
                    className="text-xs text-slate-400"
                    onClick={() => patch(i, { options: q.options.filter((_, j) => j !== oi) })}
                  >
                    ×
                  </button>
                </li>
              ))}
              <button
                type="button"
                className="text-xs text-[#1A7A72]"
                onClick={() =>
                  patch(i, {
                    options: [...q.options, { id: String.fromCharCode(97 + q.options.length), label: "", score: 0 }],
                  })
                }
              >
                + 选项
              </button>
            </ul>
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded border px-3 py-1" onClick={() => setQuestions([...questions, emptySingle()])}>
          + 单选题
        </button>
        <button
          type="button"
          className="rounded border px-3 py-1"
          onClick={() =>
            setQuestions([
              ...questions,
              { id: qid(), prompt: "", type: "multiple", options: [{ id: "a", label: "", score: 1 }, { id: "b", label: "", score: 1 }, { id: "c", label: "", score: 0 }] },
            ])
          }
        >
          + 多选题
        </button>
        <button
          type="button"
          className="rounded border px-3 py-1"
          onClick={() => setQuestions([...questions, { id: qid(), prompt: "", type: "text", options: [], textAnswer: "", textScore: 2 }])}
        >
          + 填空题
        </button>
      </div>
      <p className="text-xs text-slate-500">选项右侧为分值：正确答案填正分，错项填 0。填空按关键词判分。考生端看不到分值和参考答案。</p>
      <button disabled={pending} className="w-full rounded-lg bg-[#0F3A5F] py-2 font-semibold text-white disabled:opacity-60">
        {pending ? "保存中…" : initial ? "保存试卷" : "保存试卷"}
      </button>
      {msg ? <p className="text-[#1A7A72]">{msg}</p> : null}
    </form>
  );
}
