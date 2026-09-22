import type { GradeDetail } from "@/lib/survey";

export function ExamResultCard({
  title,
  nurseName,
  score,
  rawScore,
  maxScore,
  grade,
  at,
  detailJson,
}: {
  title: string;
  nurseName: string;
  score: number;
  rawScore: number;
  maxScore: number;
  grade: string;
  at: string;
  detailJson: string;
}) {
  let detail: GradeDetail[] = [];
  try {
    detail = JSON.parse(detailJson || "[]") as GradeDetail[];
  } catch {
    detail = [];
  }
  return (
    <details className="rounded-xl border bg-white p-3 text-sm">
      <summary className="cursor-pointer font-medium">
        {nurseName} · {title} · {rawScore}/{maxScore} 分（{score} 分制）· {grade}
        <span className="ml-2 text-xs font-normal text-slate-400">{at}</span>
      </summary>
      <ul className="mt-3 space-y-2">
        {detail.map((d) => (
          <li key={d.questionId} className="rounded bg-slate-50 p-2">
            <p className="font-medium">{d.prompt}</p>
            <p className="mt-1 text-xs text-slate-600">作答：{d.yourAnswer}</p>
            <p className="text-xs text-[#1A7A72]">参考：{d.correctAnswer}</p>
            <p className="text-xs text-slate-500">
              本题 {d.points}/{d.maxPoints} 分
            </p>
          </li>
        ))}
        {detail.length === 0 ? <li className="text-slate-500">暂无逐题明细（旧答卷）</li> : null}
      </ul>
    </details>
  );
}
