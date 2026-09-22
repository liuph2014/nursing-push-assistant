import Link from "next/link";
import { stats, type StatsRange } from "@/lib/queries";
import { getRole } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/demo";
import { formatDemoDate } from "@/lib/clock";
import { PageHeader } from "@/components/PageHeader";
import { PrintButton } from "@/components/PrintButton";

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: raw = "today" } = await searchParams;
  const range: StatsRange =
    raw === "7" ? "7" : raw === "30" ? "30" : raw === "all" ? "all" : "today";
  const role = await getRole();
  const s = await stats(range);
  const cards = [
    { label: s.newLabel, value: s.newCount },
    { label: "有效阅读人数", value: s.readPeople },
    { label: "未读人数", value: s.unreadPeople },
    { label: "在院人数", value: s.census },
  ];

  return (
    <div>
      <PageHeader
        kicker={`${ROLE_LABEL[role]} · ${formatDemoDate(s.now)}`}
        title="成效看板"
        description="护理部与质控默认落在本页。新增人数按套用路径日期统计。"
        actions={<PrintButton />}
      />
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {[
          { id: "today", label: "今日" },
          { id: "7", label: "近 7 天" },
          { id: "30", label: "近 30 天" },
          { id: "all", label: "全部" },
        ].map((r) => (
          <Link
            key={r.id}
            href={`/app/stats?range=${r.id}`}
            className={`rounded-full px-3 py-1 ${range === r.id ? "bg-navy text-white" : "bg-white/80 ring-1 ring-[var(--line)]"}`}
          >
            {r.label}
          </Link>
        ))}
      </div>
      <div id="board" className="mt-4 grid scroll-mt-28 grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="surface rounded-2xl p-5">
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="mt-2 font-serif text-4xl text-navy">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="surface rounded-2xl p-5">
          <h2 className="font-semibold text-navy">成员数据</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {s.members.map((m) => (
              <li key={m.name} className="flex justify-between gap-2">
                <span>{m.name}</span>
                <span>
                  覆盖率 {m.coverage}% · 推送 {m.pushes} · 未读 {m.unread}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="surface rounded-2xl p-5">
          <h2 className="font-semibold text-navy">入院包 24 小时完成率</h2>
          <p className="mt-3 font-serif text-3xl text-navy">
            {s.pathTotal ? Math.round((s.pathDone / s.pathTotal) * 100) : 0}%
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {s.pathDone}/{s.pathTotal} 人在套路径后 24 小时内完成当日条目
          </p>
        </section>
      </div>
      <div className="surface mt-6 rounded-2xl p-5">
        <h2 className="font-semibold text-navy">月报摘要</h2>
        <p className="mt-2 text-sm leading-7">
          覆盖：有效阅读 {s.readPeople} 人。未读 {s.unreadPeople} 人。路径 24h 完成 {s.pathDone}/{s.pathTotal}。满意度与知晓率见问卷回收。
        </p>
        <PrintButton label="打印 / 导出月报" />
      </div>
    </div>
  );
}
