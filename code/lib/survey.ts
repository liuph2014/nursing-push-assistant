export type Question = {
  id: string;
  prompt: string;
  type: "single" | "multiple" | "text";
  options: { id: string; label: string; score: number }[];
  textAnswer?: string;
  textScore?: number;
};

export type GradeBand = { min: number; label: string };

export type GradeDetail = {
  questionId: string;
  prompt: string;
  type: string;
  yourAnswer: string;
  correctAnswer: string;
  points: number;
  maxPoints: number;
};

export function parseQuestions(json: string): Question[] {
  return JSON.parse(json) as Question[];
}

export function parseGrades(json: string): GradeBand[] {
  return JSON.parse(json) as GradeBand[];
}

export function stripAnswerKey(questions: Question[]): Question[] {
  return questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    type: q.type,
    options: q.options.map((o) => ({ id: o.id, label: o.label, score: 0 })),
  }));
}

function optionLabel(q: Question, id: string) {
  return q.options.find((o) => o.id === id)?.label || id;
}

function correctLabels(q: Question) {
  if (q.type === "text") return q.textAnswer || "（主观题，按关键词判分）";
  return q.options
    .filter((o) => o.score > 0)
    .map((o) => o.label)
    .join("、");
}

function answerLabels(q: Question, ans: string | string[] | undefined) {
  if (q.type === "text") return typeof ans === "string" ? ans : "";
  if (Array.isArray(ans)) return ans.map((id) => optionLabel(q, id)).join("、");
  if (typeof ans === "string") return optionLabel(q, ans);
  return "未作答";
}

export function scoreSurvey(questions: Question[], answers: Record<string, string | string[]>, grades: GradeBand[]) {
  let raw = 0;
  let max = 0;
  const detail: GradeDetail[] = [];
  for (const q of questions) {
    const ans = answers[q.id];
    let points = 0;
    let maxPoints = 0;
    if (q.type === "text") {
      maxPoints = q.textScore ?? 0;
      const expected = (q.textAnswer || "").trim();
      const got = typeof ans === "string" ? ans.trim() : "";
      if (expected && got) {
        const keys = expected.split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
        const hit = keys.length ? keys.every((k) => got.includes(k)) : got === expected;
        if (hit) points = maxPoints;
      }
    } else {
      maxPoints = q.options.reduce((s, o) => s + Math.max(0, o.score), 0);
      if (q.type === "single" && typeof ans === "string") {
        points = q.options.find((o) => o.id === ans)?.score ?? 0;
      } else if (q.type === "multiple" && Array.isArray(ans)) {
        for (const id of ans) points += q.options.find((o) => o.id === id)?.score ?? 0;
      }
    }
    raw += points;
    max += maxPoints;
    detail.push({
      questionId: q.id,
      prompt: q.prompt,
      type: q.type,
      yourAnswer: answerLabels(q, ans) || "未作答",
      correctAnswer: correctLabels(q),
      points,
      maxPoints,
    });
  }
  const pct = max > 0 ? Math.round((raw / max) * 100) : 0;
  const band = [...grades].sort((a, b) => b.min - a.min).find((g) => pct >= g.min);
  return { score: pct, rawScore: raw, maxScore: max, grade: band?.label ?? "", detail };
}
