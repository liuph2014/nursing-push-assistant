import Link from "next/link";
import { redirect } from "next/navigation";
import { stayByToken, getSettings } from "@/lib/queries";
import { NoticeAckButton } from "@/components/NoticeAckButton";
import { SurveyForm } from "@/components/SurveyForm";
import { noteImages } from "@/lib/note";

function label(status: string) {
  if (status === "read") return "已完成";
  if (status === "done") return "护士已补讲";
  if (status === "pending") return "尚未推送";
  return "待学习";
}

function titleOf(t: { article?: { title: string } | null; questionnaire?: { title: string } | null; noticeBody: string }) {
  return t.article?.title || t.questionnaire?.title || t.noticeBody.slice(0, 24) || "通知";
}

function coverOf(article?: { mediaType: string; mediaUrl: string } | null) {
  if (!article) return "";
  return noteImages(article.mediaType, article.mediaUrl)[0] || "";
}

export default async function InboxPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { token } = await params;
  const { tab } = await searchParams;
  const stay = await stayByToken(token);
  if (!stay) {
    return (
      <main className="px-6 py-16 text-center">
        <h1 className="text-xl font-bold">码已失效，请找护士</h1>
      </main>
    );
  }
  if (!stay.consentAcceptedAt) redirect(`/p/${token}/consent`);
  const settings = await getSettings();
  if (settings.requireIntakeForm && !stay.intakeFilledAt) redirect(`/p/${token}/intake`);

  const showDone = tab === "done";
  const tasks = stay.tasks.filter((t) => {
    if (t.status === "pending") return false;
    if (showDone) return t.status === "read" || t.status === "done";
    if (t.contentType === "notice") return t.status === "delivered" && !t.noticeAckAt;
    return t.status === "delivered";
  });

  return (
    <main className="mx-auto max-w-md px-5 py-6">
      <p className="text-sm text-teal">
        {stay.bed.code} 床 · {stay.bed.patientName}
      </p>
      <h1 className="mt-1 font-serif text-3xl text-navy">{showDone ? "已完成" : "我的待学习"}</h1>
      {tasks.length === 0 ? (
        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-amber-900">
          {showDone
            ? "还没有已完成的内容。"
            : "还没有宣教任务。请让护士在电脑上为您套用入院路径后再扫码。"}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {tasks.map((t) => (
            <li key={t.id}>
              {t.contentType === "questionnaire" && t.questionnaire ? (
                <div className="surface rounded-2xl p-4">
                  <p className="font-semibold">{t.questionnaire.title}</p>
                  <p className="text-sm text-slate-500">{label(t.status)}</p>
                  {t.status === "delivered" ? (
                    <div className="mt-3">
                      <SurveyForm
                        questionnaireId={t.questionnaire.id}
                        questionsJson={t.questionnaire.questionsJson}
                        taskId={t.id}
                        token={token}
                      />
                    </div>
                  ) : null}
                </div>
              ) : t.contentType === "notice" ? (
                <div className="surface rounded-2xl p-4">
                  <p className="font-semibold">护士通知</p>
                  <p className="mt-2 whitespace-pre-wrap text-slate-700">{t.noticeBody}</p>
                  {t.status === "delivered" && !t.noticeAckAt ? (
                    <div className="mt-3">
                      <NoticeAckButton taskId={t.id} token={token} />
                    </div>
                  ) : null}
                </div>
              ) : (
                <Link href={`/p/${token}/articles/${t.articleId}`} className="surface block overflow-hidden rounded-2xl">
                  {coverOf(t.article) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverOf(t.article)} alt="" className="h-36 w-full object-cover" />
                  ) : null}
                  <div className="p-4">
                    <div className="flex justify-between">
                      <span className="font-semibold">{titleOf(t)}</span>
                      <span className={`text-sm ${t.status === "delivered" ? "text-[#D32F2F]" : "text-[#1A7A72]"}`}>
                        {label(t.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{t.article?.summary}</p>
                  </div>
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-10 text-center text-xs text-slate-400">宣武医院神经外科</p>
    </main>
  );
}
