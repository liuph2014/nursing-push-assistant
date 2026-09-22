import { prisma } from "@/lib/prisma";
import { getRole } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { PostButton } from "@/components/PostButton";

const ANCHOR: Record<string, string> = {
  first_scan: "首次扫码",
  admitted: "入院日",
  surgery: "手术日",
  discharged: "出院日",
};

export default async function PlansPage() {
  const role = await getRole();
  const plans = await prisma.pushPlan.findMany({ include: { tagGroup: true, article: true } });
  const missingSurgery = await prisma.stay.count({
    where: { status: "in_ward", surgeryAt: null, tags: { some: { tagGroupId: "tag-surgery" } } },
  });

  return (
    <div>
      <PageHeader
        kicker="宣教"
        title="智能计划"
        description="一次设定，按标记组圈人。到期后打开护士站会自动生成任务。缺手术日的计划会跳过。"
      />
      {missingSurgery > 0 ? (
        <p className="mt-3 rounded bg-amber-50 p-3 text-sm text-amber-900">有 {missingSurgery} 人打了手术标记但未填手术日，手术锚点计划不会发给他们。</p>
      ) : null}
      <ul className="mt-4 space-y-3">
        {plans.map((p) => (
          <li key={p.id} className="rounded-xl border bg-white p-4">
            <p className="font-semibold">{p.name}</p>
            <p className="mt-1 text-sm text-slate-500">
              人群 {p.tagGroup.name} · 锚点 {ANCHOR[p.anchor] || p.anchor} · 偏移 {p.offsetDays} 天 · 内容 {p.article.title}
            </p>
            <p className="mt-1 text-sm">{p.enabled ? "已启用" : "已停用"}</p>
            {role === "head_nurse" ? (
              <div className="mt-2">
                <PostButton
                  action={`/api/plans/${p.id}`}
                  body={{ enabled: !p.enabled }}
                  className="rounded bg-[#0F3A5F] px-3 py-1 text-sm text-white"
                >
                  {p.enabled ? "停用" : "启用"}
                </PostButton>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
