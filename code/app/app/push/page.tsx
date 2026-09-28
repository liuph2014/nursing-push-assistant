import { prisma } from "@/lib/prisma";
import { getActorId, getRole } from "@/lib/session";
import { PushForm } from "@/components/PushForm";
import { PostButton } from "@/components/PostButton";
import { getSettings } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { ROLE_LABEL } from "@/lib/demo";

const STATUS: Record<string, string> = {
  sent: "已发送",
  scheduled: "定时待执行",
  pending_confirm: "待护士长确认",
  rejected: "已驳回",
  withdrawn: "已撤回",
};

export default async function PushPage({ searchParams }: { searchParams: Promise<{ article?: string }> }) {
  const role = await getRole();
  const actorId = await getActorId();
  const { article: initialArticleId } = await searchParams;
  const settings = await getSettings();
  const [articles, questionnaires, tags, jobs, stays] = await Promise.all([
    prisma.article.findMany({
      where: { status: "published", scope: { notIn: ["public_lib", "hospital"] } },
      include: { category: true },
      orderBy: { sortOrder: "desc" },
    }),
    prisma.questionnaire.findMany(),
    prisma.tagGroup.findMany(),
    prisma.pushJob.findMany({ include: { article: true, questionnaire: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.stay.findMany({
      where: { status: "in_ward" },
      include: { bed: true },
    }),
  ]);
  stays.sort((a, b) => a.bed.code - b.bed.code);
  const canWard = role === "head_nurse" || settings.requirePushConfirm;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <PageHeader
          kicker="宣教"
          title="群发"
          description="从图文库选文后，可勾选单个患者发送，或按标记组圈人。责任护士默认只能推责任床。"
        />
        {role === "nursing_admin" || role === "qa_readonly" ? (
          <p className="mt-4 rounded bg-slate-100 p-3 text-sm">当前角色不能群发。</p>
        ) : (
          <div className="mt-4">
            <PushForm
              initialArticleId={initialArticleId}
              actorId={actorId}
              articles={articles.map((a) => ({
                id: a.id,
                title: a.title,
                summary: a.summary,
                category: a.category?.name ?? "",
                keywords: a.keywords,
                mediaType: a.mediaType,
                mediaUrl: a.mediaUrl,
              }))}
              questionnaires={questionnaires.map((q) => ({ id: q.id, title: q.title }))}
              tags={tags.map((t) => ({ id: t.id, name: t.name }))}
              stays={stays.map((s) => ({
                stayId: s.id,
                bedCode: s.bed.code,
                patientName: s.bed.patientName,
                diagnosis: s.diagnosis,
                primaryNurseId: s.bed.primaryNurseId || "",
              }))}
              canWard={canWard}
            />
          </div>
        )}
      </div>
      <div>
        <h2 className="text-lg font-bold text-[#0F3A5F]">发送记录</h2>
        <ul className="mt-3 space-y-3">
          {jobs.length === 0 ? <li className="text-slate-500">还没有群发。</li> : null}
          {jobs.map((j) => {
            const ownerId = (j as { createdById?: string }).createdById || "";
            const canWithdraw =
              (j.status === "sent" || j.status === "scheduled" || j.status === "pending_confirm") &&
              (role === "head_nurse" || (role === "primary_nurse" && ownerId === actorId));
            return (
              <li key={j.id} className="rounded-xl border bg-white p-4 text-sm">
                <p className="font-semibold">
                  {j.article?.title || j.questionnaire?.title || j.noticeBody.slice(0, 20) || "群发"}
                </p>
                <p className="mt-1 text-slate-500">
                  {STATUS[j.status] || j.status} · {ROLE_LABEL[j.createdBy as keyof typeof ROLE_LABEL] || j.createdBy} · 应发{" "}
                  {j.statsSent}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {j.status === "pending_confirm" && role === "head_nurse" ? (
                    <>
                      <PostButton action={`/api/push/${j.id}/confirm`} className="rounded bg-[#1A7A72] px-3 py-1 text-white">
                        确认发送
                      </PostButton>
                      <PostButton action={`/api/push/${j.id}/reject`} className="rounded bg-slate-200 px-3 py-1">
                        驳回
                      </PostButton>
                    </>
                  ) : null}
                  {canWithdraw ? (
                    <PostButton action={`/api/push/${j.id}/withdraw`} className="rounded bg-red-50 px-3 py-1 text-red-700">
                      撤回
                    </PostButton>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
