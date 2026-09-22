import { Suspense } from "react";
import Link from "next/link";
import { getActorId, getRole } from "@/lib/session";
import { listBeds } from "@/lib/queries";
import { ROLE_LABEL, maskName } from "@/lib/demo";
import { formatDemoDate, getDemoNow } from "@/lib/clock";
import { WardSearch } from "@/components/WardSearch";
import { PageHeader } from "@/components/PageHeader";

export default async function WardPage() {
  const role = await getRole();
  const actorId = await getActorId();
  const beds = await listBeds(role, actorId);
  const now = await getDemoNow();
  const cards = beds.map((bed) => ({
    id: bed.id,
    code: bed.code,
    name: maskName(bed.patientName, role),
    nurseName: bed.assignedNurse?.name ? `${bed.assignedNurse.name} · ${bed.assignedNurse.bedsLabel}` : "未指定",
    unread: bed.unread,
    diagnosis: bed.stay?.diagnosis ?? "",
    hospitalNo: bed.stay?.hospitalNo ?? "",
    dietOrder: bed.stay?.dietOrder ?? "",
    allergy: bed.stay?.allergy ?? "",
    nursingLevel: bed.stay?.nursingLevel ?? "",
    gender: bed.stay?.gender ?? "",
    age: bed.stay?.age ?? 0,
    admittedAt: bed.stay?.admittedAt ? formatDemoDate(bed.stay.admittedAt) : "",
    surgeryAt: bed.stay?.surgeryAt ? formatDemoDate(bed.stay.surgeryAt) : "",
    tags: bed.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
    dimmed: bed.dimmed,
    discharged: bed.discharged,
    applied: bed.applied,
  }));

  return (
    <div>
      <PageHeader
        kicker={`${ROLE_LABEL[role]} · ${formatDemoDate(now)}`}
        title="床位图"
        description={
          role === "primary_nurse"
            ? "仅可操作责任床。用检索找人，用档案归类按手术日、住院时间、护理等级查看。"
            : role === "nursing_admin" || role === "qa_readonly"
              ? "只读查看，成果请到成效看板。"
              : "检索找人；档案归类按诊断、护理等级、手术日、住院时间整理交班。"
        }
        actions={
          <Link href="/app/tasks" className="ui-btn ui-btn-navy">
            去今日任务
          </Link>
        }
      />
      <Suspense fallback={<p className="text-sm text-slate-500">加载床位…</p>}>
        <WardSearch beds={cards} today={formatDemoDate(now)} />
      </Suspense>
    </div>
  );
}
