import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getRole } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { PostButton } from "@/components/PostButton";

export default async function PathwaysPage() {
  const role = await getRole();
  if (role === "primary_nurse") redirect("/app/ward");
  const pathways = await prisma.pathway.findMany({
    include: { items: { include: { article: true, questionnaire: true }, orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div>
      <PageHeader kicker="宣教" title="宣教路径" description="普通入院已启用。脑梗死路径默认待审核，护士长点启用后才能套到患者。" />
      <ul className="mt-4 space-y-4">
        {pathways.map((p) => (
          <li key={p.id} className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-slate-500">
                  {p.kind === "disease" ? "病种路径" : "通用路径"} · {p.status === "active" ? "已启用" : "待审核"}
                </p>
              </div>
              {role === "head_nurse" || role === "nursing_admin" ? (
                <PostButton
                  action={`/api/pathways/${p.id}`}
                  body={{ status: p.status === "active" ? "pending_review" : "active" }}
                  className="rounded bg-[#0F3A5F] px-3 py-2 text-sm text-white"
                >
                  {p.status === "active" ? "撤回待审" : "审核并启用"}
                </PostButton>
              ) : null}
            </div>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
              {p.items.map((it) => (
                <li key={it.id}>
                  第 {it.offsetDays} 天 · {it.article?.title || it.questionnaire?.title || "通知"}
                  {it.bedsideRequired ? " · 须当面" : ""}
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
    </div>
  );
}
