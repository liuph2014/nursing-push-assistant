import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ApplyPathwayButton } from "@/components/ApplyPathwayButton";
import { TagGroupEditor } from "@/components/TagGroupEditor";
import { BedProfileForm } from "@/components/BedProfileForm";
import { StayActions } from "@/components/StayActions";
import { PageHeader } from "@/components/PageHeader";
import { STAFF_NURSES, canManageBed, maskName, patientUrl, wardJoinUrl } from "@/lib/demo";
import { getBedByCode, getSettings, listTagGroups } from "@/lib/queries";
import { getActorId, getRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDemoDate } from "@/lib/clock";

function statusLabel(s: string) {
  if (s === "read") return "已读";
  if (s === "done") return "已当面完成";
  if (s === "delivered") return "未读";
  if (s === "pending") return "待推";
  return s;
}

function taskTitle(t: { article?: { title: string } | null; questionnaire?: { title: string } | null; noticeBody: string }) {
  return t.article?.title || t.questionnaire?.title || t.noticeBody.slice(0, 24) || "通知";
}

export default async function BedPage({ params }: { params: Promise<{ bedId: string }> }) {
  const { bedId } = await params;
  const code = Number(bedId);
  const bed = await getBedByCode(code);
  if (!bed?.stay) notFound();
  const role = await getRole();
  const actorId = await getActorId();
  const manage = canManageBed(role, bed.primaryNurseId, actorId);
  const nurseOptions = STAFF_NURSES.map((n) => ({ id: n.id, label: `${n.name} · ${n.bedsLabel}` }));
  const settings = await getSettings();
  const wardToken = (settings as { wardJoinToken?: string }).wardJoinToken || "demo-ward";
  const wardUrl = wardJoinUrl(wardToken);
  const stayUrl = patientUrl(bed.stay.accessToken);
  const [wardQr, stayQr, groups, pathways, emptyBeds] = await Promise.all([
    QRCode.toDataURL(wardUrl, { width: 280, margin: 1 }),
    QRCode.toDataURL(stayUrl, { width: 200, margin: 1 }),
    listTagGroups(),
    prisma.pathway.findMany({ orderBy: { name: "asc" } }),
    prisma.bed.findMany({
      where: { stay: { status: "discharged" } },
      select: { code: true },
    }),
  ]);
  const tasks = bed.stay.tasks;
  const surgery = bed.stay.surgeryAt ? formatDemoDate(bed.stay.surgeryAt) : "";
  const stayExtra = bed.stay as { attendingDoctor?: string; bedDoctor?: string };

  return (
    <div>
      <PageHeader
        kicker="作业台 · 床位"
        title={`${bed.code} 床 · ${maskName(bed.patientName, role)}`}
        description={`${bed.stay.status === "discharged" ? "已出院" : "在院"}${bed.stay.pathwayAppliedAt ? " · 已套用路径" : " · 尚未套用路径"} · 入科 ${formatDemoDate(bed.stay.admittedAt)}`}
        actions={
          <Link href="/app/ward" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy ring-1 ring-[var(--line)]">
            返回床位图
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
      <section className="surface rounded-2xl p-5">
        {manage ? (
          <div id="apply-pathway" className="scroll-mt-28">
            <ApplyPathwayButton
              bedId={bed.id}
              pathways={pathways.map((p) => ({ id: p.id, name: p.name, status: p.status }))}
            />
            <p className="mt-2 text-sm text-slate-500">启用中的路径可套用。脑梗死路径需护士长先在「路径」页点启用。</p>
          </div>
        ) : (
          <p className="mt-4 rounded bg-slate-100 p-3 text-sm">当前角色不能给此床套路径。</p>
        )}
        <ul id="tasks-list" className="mt-4 scroll-mt-28 space-y-2">
          {tasks.length === 0 ? (
            <li className="text-slate-500">还没有待学习内容。</li>
          ) : (
            tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded border px-3 py-2">
                <span>
                  {taskTitle(t)}
                  {t.dwellMs > 0 ? <span className="ml-2 text-xs text-slate-500">停留 {Math.round(t.dwellMs / 1000)} 秒</span> : null}
                </span>
                <span className={`text-sm font-semibold ${t.status === "delivered" ? "text-[#D32F2F]" : t.status === "pending" ? "text-slate-500" : "text-[#1A7A72]"}`}>
                  {statusLabel(t.status)}
                  {t.deliveryCount > 1 ? " · 已补推" : ""}
                </span>
              </li>
            ))
          )}
        </ul>
        <div className="mt-6 border-t pt-4">
          <h2 className="text-lg font-bold text-[#0F3A5F]">患者档案</h2>
          <BedProfileForm
            bedId={bed.id}
            patientName={maskName(bed.patientName, role)}
            gender={bed.stay.gender}
            age={bed.stay.age}
            hospitalNo={bed.stay.hospitalNo}
            admittedAt={formatDemoDate(bed.stay.admittedAt)}
            diagnosis={bed.stay.diagnosis}
            nursingLevel={bed.stay.nursingLevel}
            dietOrder={bed.stay.dietOrder}
            allergy={bed.stay.allergy}
            contactName={bed.stay.contactName}
            contactPhone={bed.stay.contactPhone}
            attendingDoctor={stayExtra.attendingDoctor || ""}
            bedDoctor={stayExtra.bedDoctor || ""}
            surgeryAt={surgery}
            primaryNurseId={bed.primaryNurseId ?? ""}
            nurseOptions={nurseOptions}
            canEdit={manage}
            isHead={role === "head_nurse"}
          />
          <StayActions
            bedId={bed.id}
            canEdit={manage}
            discharged={bed.stay.status === "discharged"}
            emptyBeds={emptyBeds.filter((b) => b.code !== bed.code)}
          />
        </div>
        <div className="mt-6 border-t pt-4">
          <TagGroupEditor
            bedId={bed.id}
            groups={groups}
            selected={bed.stay.tags.map((t) => t.tagGroupId)}
            canEdit={manage}
          />
        </div>
      </section>
      <section id="bed-qr" className="scroll-mt-28 space-y-5">
        <div className="surface rounded-2xl p-5 text-center">
          <h2 className="text-lg font-semibold text-navy">病区统一码 · 请用微信扫</h2>
          <p className="mt-1 text-xs text-slate-500">每个病区一个码；患者扫码填档或跳过，由护士后台补全。</p>
          <p className="mt-1 break-all text-xs text-slate-500">{wardUrl}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wardQr} alt="病区入组码" className="mx-auto mt-3 h-56 w-56" />
          <p className="mt-3 text-sm text-slate-600">
            {wardUrl.startsWith("https://")
              ? "微信扫码需公网 HTTPS（443 已放行且已配置证书）。若打不开，请用浏览器打开上方链接，或联系运维开通 HTTPS。"
              : "当前为 HTTP 地址，可用手机浏览器打开；微信内若拦截，请点右上角用浏览器打开，或开通 HTTPS 后重建二维码。"}
          </p>
          <a
            href={wardUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white"
          >
            在浏览器打开入组页
          </a>
        </div>
        <details className="surface rounded-2xl p-5">
          <summary className="cursor-pointer text-sm font-semibold text-slate-600">本床调试链接（兼容旧床头码）</summary>
          <p className="mt-2 break-all text-xs text-slate-500">{stayUrl}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stayQr} alt="本床调试码" className="mx-auto mt-3 h-40 w-40 opacity-80" />
          <p className="mt-3 break-all font-mono text-sm text-navy">{stayUrl}</p>
          <a
            href={stayUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy ring-1 ring-[var(--line)]"
          >
            在浏览器打开本床患者页
          </a>
        </details>
      </section>
    </div>
    </div>
  );
}
