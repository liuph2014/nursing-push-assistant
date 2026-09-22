import { prisma } from "@/lib/prisma";
import { getRole } from "@/lib/session";
import { getSettings } from "@/lib/queries";
import { SettingsForm } from "@/components/SettingsForm";
import { TagGroupCatalog } from "@/components/TagGroupCatalog";
import { PageHeader } from "@/components/PageHeader";
import { ROLE_LABEL, appUrl, canManageTagCatalog } from "@/lib/demo";
import { formatDemoDate } from "@/lib/clock";

export default async function SettingsPage() {
  const role = await getRole();
  const [settings, org, invite, audits, groups] = await Promise.all([
    getSettings(),
    prisma.orgNode.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.inviteLink.findUnique({ where: { id: "demo-invite" } }),
    prisma.auditLog.findMany({ orderBy: { at: "desc" }, take: 30 }),
    prisma.tagGroup.findMany({ orderBy: { name: "asc" } }),
  ]);
  const inviteUrl = `${appUrl()}/app/login?invite=${invite?.token ?? ""}`;

  return (
    <div>
      <PageHeader kicker="系统" title="设置与质控" description={`${ROLE_LABEL[role]} · 病区参数、标记组目录与审计。`} />
      <div className="grid gap-6 lg:grid-cols-2">
      <div>
        {role === "head_nurse" ? (
          <SettingsForm
            autoDischargeDays={settings.autoDischargeDays}
            hotline={settings.hotline}
            hotlineLabel={settings.hotlineLabel}
            requireIntakeForm={settings.requireIntakeForm}
            requirePushConfirm={settings.requirePushConfirm}
            diseaseZoneName={settings.diseaseZoneName}
          />
        ) : (
          <p className="mt-3 text-sm text-slate-500">宣教设置仅护士长可改。咨询开关保持关闭。</p>
        )}
        <TagGroupCatalog groups={groups} canEdit={canManageTagCatalog(role)} />
        <section className="mt-6 rounded-xl border bg-white p-5">
          <h2 className="font-bold text-[#0F3A5F]">组织树（只读）</h2>
          <ul className="mt-2 text-sm leading-7">
            {org.map((n) => (
              <li key={n.id} className={n.kind === "hospital" ? "" : "ml-4"}>
                {n.kind === "campus" || n.kind === "dept" || n.kind === "ward" ? "└ " : ""}
                {n.name}
                <span className="text-slate-400"> · {n.kind}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-6 rounded-xl border bg-white p-5">
          <h2 className="font-bold text-[#0F3A5F]">邀请医护加入</h2>
          <p className="mt-1 break-all text-sm">{inviteUrl}</p>
          <p className="mt-2 text-xs text-slate-500">演示用链接，打开后以责任护士进入。不发短信，不做微信码。</p>
        </section>
      </div>
      <div>
        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-bold text-[#0F3A5F]">操作审计</h2>
          <ul className="mt-3 max-h-[480px] space-y-2 overflow-auto text-sm">
            {audits.length === 0 ? <li className="text-slate-500">还没有操作记录。</li> : null}
            {audits.map((a) => (
              <li key={a.id} className="border-b pb-2">
                <span className="text-slate-400">{formatDemoDate(a.at)} </span>
                {ROLE_LABEL[a.actorRole as keyof typeof ROLE_LABEL] || a.actorRole} · {a.action} · {a.target}
                {a.detail ? ` · ${a.detail}` : ""}
              </li>
            ))}
          </ul>
        </section>
      </div>
      </div>
    </div>
  );
}
