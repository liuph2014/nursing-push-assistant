"use client";

import { useState, useTransition } from "react";
import { parseQuestions, type GradeDetail, type Question } from "@/lib/survey";

export function SurveyForm({
  questionnaireId,
  questionsJson,
  taskId,
  token,
  asExam,
  name,
  assignmentId,
  hideKey,
}: {
  questionnaireId: string;
  questionsJson: string;
  taskId?: string;
  token?: string;
  asExam?: boolean;
  name?: string;
  assignmentId?: string;
  hideKey?: boolean;
}) {
  const questions = parseQuestions(questionsJson);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [result, setResult] = useState<{
    score: number;
    grade: string;
    rawScore?: number;
    maxScore?: number;
    detail?: GradeDetail[];
  } | null>(null);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  function setSingle(id: string, v: string) {
    setAnswers((a) => ({ ...a, [id]: v }));
  }
  function toggleMulti(id: string, opt: string) {
    setAnswers((a) => {
      const cur = Array.isArray(a[id]) ? (a[id] as string[]) : [];
      return { ...a, [id]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] };
    });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setErr("");
          const res = await fetch("/api/surveys/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionnaireId, answers, taskId, token, asExam, name, assignmentId }),
          });
          const data = (await res.json()) as {
            error?: string;
            score: number;
            grade: string;
            rawScore?: number;
            maxScore?: number;
            detail?: GradeDetail[];
          };
          if (!res.ok) {
            setErr(data.error || "提交失败");
            return;
          }
          setResult(data);
        });
      }}
    >
      {questions.map((q: Question) => (
        <fieldset key={q.id} className="rounded-xl border bg-white p-4">
          <legend className="font-semibold">{q.prompt}</legend>
          {q.type === "text" ? (
            <textarea className="mt-2 w-full rounded border px-2 py-1" onChange={(e) => setSingle(q.id, e.target.value)} />
          ) : (
            <div className="mt-2 space-y-1">
              {q.options.map((o) => (
                <label key={o.id} className="flex items-center gap-2 text-sm">
                  <input
                    type={q.type === "multiple" ? "checkbox" : "radio"}
                    name={q.id}
                    onChange={() => (q.type === "multiple" ? toggleMulti(q.id, o.id) : setSingle(q.id, o.id))}
                  />
                  {o.label}
                  {!hideKey && o.score ? <span className="text-xs text-slate-400">（{o.score} 分）</span> : null}
                </label>
              ))}
            </div>
          )}
        </fieldset>
      ))}
      <button disabled={pending || Boolean(result)} className="w-full rounded-xl bg-[#C45C26] py-3 font-bold text-white disabled:opacity-60">
        {pending ? "提交中…" : result ? "已交卷" : "提交"}
      </button>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {result ? (
        <div className="rounded-xl bg-[#1A7A72] p-4 text-white">
          <p className="text-center font-semibold">
            得分 {result.rawScore ?? result.score}
            {result.maxScore != null ? ` / ${result.maxScore}` : ""} · {result.score} 分制 · {result.grade}
          </p>
          {result.detail?.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {result.detail.map((d) => (
                <li key={d.questionId} className="rounded bg-white/10 p-2">
                  <p>{d.prompt}</p>
                  <p className="text-xs opacity-90">你的作答：{d.yourAnswer}</p>
                  <p className="text-xs opacity-90">参考答案：{d.correctAnswer}</p>
                  <p className="text-xs">
                    {d.points}/{d.maxPoints} 分
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
