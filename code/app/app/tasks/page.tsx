import Link from "next/link";
import { BedsideDoneButton } from "@/components/BedsideDoneButton";
import { NoticeAckButton } from "@/components/NoticeAckButton";
import { PageHeader } from "@/components/PageHeader";
import { listTasks } from "@/lib/queries";
import { getActorId, getRole } from "@/lib/session";
import { canManageBed, maskName } from "@/lib/demo";

function taskTitle(t: { article?: { title: string } | null; questionnaire?: { title: string } | null; noticeBody: string }) {
  return t.article?.title || t.questionnaire?.title || t.noticeBody.slice(0, 24) || "通知";
}

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "unread" } = await searchParams;
  const role = await getRole();
  const actorId = await getActorId();
  const tasks = await listTasks();
  const visible = tasks.filter((t) => {
    if (t.stay.status === "discharged") return false;
    if (role === "primary_nurse" && !canManageBed(role, t.stay.bed.primaryNurseId, actorId)) return false;
    return true;
  });
  const filtered = visible.filter((t) => {
    if (tab === "pending") return t.status === "pending";
    if (tab === "bedside") {
      return t.status === "delivered" && t.bedsideRequired && !t.effectiveReadAt && !t.bedsideDoneAt;
    }
    if (tab === "notice") return t.contentType === "notice" && t.status === "delivered" && !t.noticeAckAt;
    return t.status === "delivered" && t.contentType !== "notice" && !t.effectiveReadAt;
  });

  const tabs = [
    { id: "unread", label: "已推未读" },
    { id: "bedside", label: "当面补讲" },
    { id: "notice", label: "通知" },
    { id: "pending", label: "待推" },
  ];

  const hint =
    tab === "pending"
      ? "未到发送时间。到期后打开护士站会自动送达。"
      : tab === "notice"
        ? "文字通知不计有效阅读。告知患者后点「已告知」。"
        : tab === "bedside"
          ? "须当面讲解、且患者尚未有效阅读。"
          : "已送达、尚未达到有效阅读的图文或问卷。";

  return (
    <div>
      <PageHeader kicker="作业台" title="今日任务" description="已推未读处理图文和问卷。当面补讲只列须当面的条目。通知单独确认。" />
      <div className="mt-3 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/app/tasks?tab=${t.id}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === t.id ? "bg-navy text-white" : "bg-white/80 text-navy ring-1 ring-[var(--line)]"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <ul id="bedside-list" className="mt-4 scroll-mt-28 space-y-3">
        {filtered.length === 0 ? (
          <li className="surface rounded-2xl p-6 text-slate-500">这一栏暂时没有任务。</li>
        ) : (
          filtered.map((t) => (
            <li key={t.id} className="surface flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
              <div>
                <p className="font-semibold">
                  {t.stay.bed.code} 床 {maskName(t.stay.bed.patientName, role)} · {taskTitle(t)}
                </p>
                <p className="text-sm text-slate-500">
                  {hint}
                  {t.deliveryCount > 1 ? " · 已按未读补推" : ""}
                </p>
              </div>
              {tab === "bedside" && canManageBed(role, t.stay.bed.primaryNurseId, actorId) ? (
                <BedsideDoneButton taskId={t.id} highlight={filtered[0]?.id === t.id} />
              ) : tab === "notice" && canManageBed(role, t.stay.bed.primaryNurseId, actorId) ? (
                <NoticeAckButton taskId={t.id} />
              ) : (
                <Link href={`/app/ward/${t.stay.bed.code}`} className="font-semibold text-[#1A7A72]">
                  查看床位
                </Link>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
