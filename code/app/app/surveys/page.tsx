import { prisma } from "@/lib/prisma";
import { getRole, getSelectedNurseId } from "@/lib/session";
import { SurveyForm } from "@/components/SurveyForm";
import { QuestionEditor } from "@/components/QuestionEditor";
import { ExamSendForm } from "@/components/ExamSendForm";
import { ExamResultCard } from "@/components/ExamResultCard";
import { PageHeader } from "@/components/PageHeader";
import { ROLE_LABEL } from "@/lib/demo";
import { formatDemoDate } from "@/lib/clock";
import { parseQuestions, stripAnswerKey } from "@/lib/survey";

export default async function SurveysPage() {
  const role = await getRole();
  const nurseId = await getSelectedNurseId();
  const [list, nurses, assignments, responses] = await Promise.all([
    prisma.questionnaire.findMany({ orderBy: { title: "asc" } }),
    prisma.staffNurse.findMany({ orderBy: { name: "asc" } }),
    prisma.examAssignment.findMany({
      include: { questionnaire: true, nurse: true },
      orderBy: { sentAt: "desc" },
      take: 80,
    }),
    prisma.surveyResponse.findMany({
      include: { questionnaire: true, stay: { include: { bed: true } }, nurse: true },
      orderBy: { submittedAt: "desc" },
      take: 80,
    }),
  ]);

  const me = nurses.find((n) => n.id === nurseId);
  const myPending = assignments.filter((a) => a.nurseId === nurseId && a.status === "pending");
  const staffScores = responses.filter((r) => r.respondentRole === "primary_nurse" || r.assignmentId);
  const myScores = staffScores.filter((r) => r.nurseId === nurseId);
  const visibleScores = role === "primary_nurse" ? myScores : staffScores;
  const patientScores = role === "primary_nurse" ? [] : responses.filter((r) => r.respondentRole === "patient");
  const csv = [
    "试卷,对象,床号,百分制,原始分,满分,等级,角色,时间",
    ...responses.map((r) =>
      [
        r.questionnaire.title,
        r.respondentName,
        r.stay?.bed.code ?? "",
        r.score,
        r.rawScore,
        r.maxScore,
        r.grade,
        r.respondentRole,
        r.submittedAt.toISOString(),
      ].join(","),
    ),
  ].join("\n");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <PageHeader kicker="质控" title="问卷与考试" description="护士长出题发送，责任护士作答后自动判卷，双方可查看历次成绩。" />
        {role === "head_nurse" ? (
          <>
            <p className="mt-1 text-sm text-slate-600">像问卷星一样出题（含答案与分值），勾选责任护士后一键发送。答案不会发给考生。</p>
            <div className="mt-4">
              <QuestionEditor />
            </div>
            {list.map((q) => (
              <details key={q.id} className="mt-3 rounded-xl border bg-white p-3">
                <summary className="cursor-pointer text-sm font-semibold">
                  {q.title}
                  {q.isExam ? " · 考核卷" : " · 患者问卷"}
                </summary>
                <div className="mt-3">
                  <QuestionEditor
                    initial={{
                      id: q.id,
                      title: q.title,
                      description: q.description,
                      questionsJson: q.questionsJson,
                      gradeJson: q.gradeJson,
                      isExam: q.isExam,
                    }}
                  />
                </div>
              </details>
            ))}
            <ExamSendForm
              questionnaires={list.map((q) => ({ id: q.id, title: q.title, isExam: q.isExam }))}
              nurses={nurses.map((n) => ({ id: n.id, name: n.name, bedsLabel: n.bedsLabel }))}
            />
          </>
        ) : role === "primary_nurse" ? (
          <>
            <p className="mt-1 text-sm text-slate-600">
              当前账号：{me?.name || "责任护士"}。待考试卷不含答案，交卷后出分并看到参考答案。
            </p>
            <h2 className="mt-4 text-lg font-bold text-[#0F3A5F]">答题通知</h2>
            {myPending.length === 0 ? <p className="mt-2 text-sm text-slate-500">暂无待完成考核。</p> : null}
            {myPending.map((a) => (
              <section key={a.id} className="mt-3 rounded-xl border bg-amber-50 p-4">
                <p className="font-semibold">{a.questionnaire.title}</p>
                <p className="text-sm text-slate-600">{a.questionnaire.description}</p>
                <p className="mt-1 text-xs text-slate-400">护士长已发送 · {formatDemoDate(a.sentAt)}</p>
                <div className="mt-3">
                  <SurveyForm
                    questionnaireId={a.questionnaireId}
                    questionsJson={JSON.stringify(stripAnswerKey(parseQuestions(a.questionnaire.questionsJson)))}
                    assignmentId={a.id}
                    hideKey
                    asExam
                    name={me?.name}
                  />
                </div>
              </section>
            ))}
          </>
        ) : (
          <p className="mt-3 text-sm text-slate-500">当前角色只读，可在右侧查看护士考核成绩。</p>
        )}
      </div>
      <div>
        <h2 className="text-lg font-bold text-[#0F3A5F]">{role === "primary_nurse" ? "我的历次评分" : "护士考核成绩（全部）"}</h2>
        <p className="mt-1 text-xs text-slate-500">点开可看原始作答、参考答案与每题分值。</p>
        {role !== "primary_nurse" ? (
          <a
            className="mt-2 inline-block text-sm text-[#1A7A72] underline"
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
            download="surveys.csv"
          >
            导出全部答卷 CSV
          </a>
        ) : null}
        <ul className="mt-3 space-y-2">
          {visibleScores.length === 0 ? <li className="text-sm text-slate-500">还没有考核成绩。</li> : null}
          {visibleScores.map((r) => (
            <li key={r.id}>
              <ExamResultCard
                title={r.questionnaire.title}
                nurseName={r.nurse?.name || r.respondentName || ROLE_LABEL[role]}
                score={r.score}
                rawScore={r.rawScore}
                maxScore={r.maxScore}
                grade={r.grade}
                at={formatDemoDate(r.submittedAt)}
                detailJson={r.detailJson}
              />
            </li>
          ))}
        </ul>
        {patientScores.length ? (
          <section className="mt-8">
            <h3 className="font-bold text-[#0F3A5F]">患者问卷回收</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {patientScores.map((r) => (
                <li key={r.id} className="rounded border bg-white p-3">
                  {r.questionnaire.title} · {r.stay ? `${r.stay.bed.code} 床` : r.respondentName} · {r.score} 分 · {r.grade}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
