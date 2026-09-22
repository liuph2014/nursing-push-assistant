"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export type WardCard = {
  id: string;
  code: number;
  name: string;
  nurseName: string;
  unread: number;
  diagnosis: string;
  hospitalNo: string;
  dietOrder: string;
  allergy: string;
  nursingLevel: string;
  gender: string;
  age: number;
  admittedAt: string;
  surgeryAt: string;
  tags: { id: string; name: string; color: string }[];
  dimmed: boolean;
  discharged: boolean;
  applied: boolean;
};

type GroupKey = "" | "diagnosis" | "level" | "surgery" | "stay" | "diet" | "allergy" | "tag";

const LEVEL_ORDER = ["特级", "一级", "二级", "三级"];
const SURGERY_ORDER = ["今日手术", "待手术", "术后", "未排手术"];
const STAY_ORDER = ["今日入科", "住院 1–3 天", "住院 4–7 天", "住院超过 7 天"];
const GROUP_OPTIONS: [GroupKey, string][] = [
  ["", "不分组"],
  ["diagnosis", "诊断"],
  ["level", "护理等级"],
  ["surgery", "手术日"],
  ["stay", "住院时间"],
  ["diet", "饮食医嘱"],
  ["allergy", "过敏史"],
  ["tag", "标记组"],
];

function daysBetween(from: string, to: string) {
  if (!from || !to) return 0;
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.round((b - a) / 86400000);
}

function stayBucket(bed: WardCard, today: string) {
  const d = daysBetween(bed.admittedAt, today);
  if (d <= 0) return "今日入科";
  if (d <= 3) return "住院 1–3 天";
  if (d <= 7) return "住院 4–7 天";
  return "住院超过 7 天";
}

function surgeryBucket(bed: WardCard, today: string) {
  if (!bed.surgeryAt) return "未排手术";
  if (bed.surgeryAt === today) return "今日手术";
  if (bed.surgeryAt > today) return "待手术";
  return "术后";
}

function cardMeta(bed: WardCard, today: string) {
  const surgery = surgeryBucket(bed, today);
  return [
    bed.nursingLevel ? `${bed.nursingLevel}护理` : "",
    stayBucket(bed, today),
    surgery === "未排手术" ? "" : surgery,
  ]
    .filter(Boolean)
    .join(" · ");
}

function matchesQ(bed: WardCard, q: string, today: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const hay = [
    String(bed.code),
    `${bed.code}床`,
    bed.name,
    bed.hospitalNo,
    bed.diagnosis,
    bed.dietOrder,
    bed.allergy,
    bed.nursingLevel,
    bed.gender,
    bed.age ? `${bed.age}岁` : "",
    bed.admittedAt,
    bed.surgeryAt,
    stayBucket(bed, today),
    surgeryBucket(bed, today),
    ...bed.tags.map((t) => t.name),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm transition ${on ? "bg-navy text-white" : "bg-white/80 text-slate-700 ring-1 ring-[var(--line)] hover:bg-white"}`}
    >
      {children}
    </button>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-[4.5rem] shrink-0 text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </div>
  );
}

function BedCard({ b, today }: { b: WardCard; today: string }) {
  const meta = cardMeta(b, today);
  return (
    <Link
      href={`/app/ward/${b.code}`}
      className={`surface rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,58,95,0.08)] ${b.dimmed ? "opacity-45" : ""} ${b.discharged ? "bg-slate-50" : ""}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-lg font-semibold text-navy">{b.code} 床</p>
        {b.unread > 0 ? (
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#D32F2F] px-1 text-xs font-bold text-white">
            {b.unread}
          </span>
        ) : b.applied ? (
          <span className="text-xs font-semibold text-[#1A7A72]">已读清</span>
        ) : null}
      </div>
      <p className="mt-2 text-base">{b.name || "空床"}</p>
      <p className="mt-0.5 truncate text-xs text-slate-500">{b.diagnosis || b.hospitalNo || "\u00a0"}</p>
      {meta ? <p className="mt-1 truncate text-sm font-medium text-clay">{meta}</p> : null}
      <div className="mt-2 flex flex-wrap gap-1">
        {b.tags.map((t) => (
          <span key={t.id} className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} title={t.name} />
        ))}
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        {b.nurseName}
        {b.discharged ? " · 已出院" : b.applied ? " · 已套路径" : " · 未套路径"}
        {b.dimmed ? " · 非责任床" : ""}
      </p>
    </Link>
  );
}

export function WardSearch({ beds, today }: { beds: WardCard[]; today: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [open, setOpen] = useState(searchParams.get("panel") === "1");
  const [group, setGroup] = useState<GroupKey>((searchParams.get("group") as GroupKey) || "");
  const [level, setLevel] = useState(searchParams.get("level") ?? "");
  const [diagnosis, setDiagnosis] = useState(searchParams.get("dx") ?? "");
  const [surgery, setSurgery] = useState(searchParams.get("op") ?? "");
  const [stay, setStay] = useState(searchParams.get("stay") ?? "");
  const [diet, setDiet] = useState(searchParams.get("diet") ?? "");
  const [allergy, setAllergy] = useState(searchParams.get("alg") ?? "");
  const [tag, setTag] = useState(searchParams.get("tag") ?? "");
  const [unreadOnly, setUnreadOnly] = useState(searchParams.get("unread") === "1");

  function apply(
    patch: Partial<{
      q: string;
      open: boolean;
      group: GroupKey;
      level: string;
      diagnosis: string;
      surgery: string;
      stay: string;
      diet: string;
      allergy: string;
      tag: string;
      unreadOnly: boolean;
    }>,
  ) {
    const next = {
      q: patch.q ?? q,
      open: patch.open ?? open,
      group: patch.group ?? group,
      level: patch.level ?? level,
      diagnosis: patch.diagnosis ?? diagnosis,
      surgery: patch.surgery ?? surgery,
      stay: patch.stay ?? stay,
      diet: patch.diet ?? diet,
      allergy: patch.allergy ?? allergy,
      tag: patch.tag ?? tag,
      unreadOnly: patch.unreadOnly ?? unreadOnly,
    };
    if (patch.q !== undefined) setQ(next.q);
    if (patch.open !== undefined) setOpen(next.open);
    if (patch.group !== undefined) setGroup(next.group);
    if (patch.level !== undefined) setLevel(next.level);
    if (patch.diagnosis !== undefined) setDiagnosis(next.diagnosis);
    if (patch.surgery !== undefined) setSurgery(next.surgery);
    if (patch.stay !== undefined) setStay(next.stay);
    if (patch.diet !== undefined) setDiet(next.diet);
    if (patch.allergy !== undefined) setAllergy(next.allergy);
    if (patch.tag !== undefined) setTag(next.tag);
    if (patch.unreadOnly !== undefined) setUnreadOnly(next.unreadOnly);

    const params = new URLSearchParams();
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.open) params.set("panel", "1");
    if (next.group) params.set("group", next.group);
    if (next.level) params.set("level", next.level);
    if (next.diagnosis) params.set("dx", next.diagnosis);
    if (next.surgery) params.set("op", next.surgery);
    if (next.stay) params.set("stay", next.stay);
    if (next.diet) params.set("diet", next.diet);
    if (next.allergy) params.set("alg", next.allergy);
    if (next.tag) params.set("tag", next.tag);
    if (next.unreadOnly) params.set("unread", "1");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const afterQ = useMemo(() => beds.filter((b) => matchesQ(b, q, today)), [beds, q, today]);
  const filtered = useMemo(() => {
    return afterQ.filter((b) => {
      if (level && b.nursingLevel !== level) return false;
      if (diagnosis && b.diagnosis !== diagnosis) return false;
      if (surgery && surgeryBucket(b, today) !== surgery) return false;
      if (stay && stayBucket(b, today) !== stay) return false;
      if (diet && b.dietOrder !== diet) return false;
      if (allergy === "有" && !b.allergy) return false;
      if (allergy === "无" && b.allergy) return false;
      if (tag && !b.tags.some((t) => t.name === tag)) return false;
      if (unreadOnly && b.unread <= 0) return false;
      return true;
    });
  }, [afterQ, level, diagnosis, surgery, stay, diet, allergy, tag, unreadOnly, today]);

  const diagnoses = useMemo(() => [...new Set(afterQ.map((b) => b.diagnosis).filter(Boolean))].sort(), [afterQ]);
  const diets = useMemo(() => [...new Set(afterQ.map((b) => b.dietOrder).filter(Boolean))].sort(), [afterQ]);
  const tagNames = useMemo(() => [...new Set(afterQ.flatMap((b) => b.tags.map((t) => t.name)))].sort(), [afterQ]);

  const shortcutCounts = useMemo(
    () => ({
      todayOp: afterQ.filter((b) => surgeryBucket(b, today) === "今日手术").length,
      postop: afterQ.filter((b) => surgeryBucket(b, today) === "术后").length,
      longStay: afterQ.filter((b) => stayBucket(b, today) === "住院超过 7 天").length,
      special: afterQ.filter((b) => b.nursingLevel === "特级").length,
    }),
    [afterQ, today],
  );

  const groups = useMemo(() => {
    if (!group) return [{ key: "", title: "", beds: filtered }];
    const map = new Map<string, WardCard[]>();
    for (const b of filtered) {
      let key = "未填";
      if (group === "diagnosis") key = b.diagnosis || "未填诊断";
      if (group === "level") key = b.nursingLevel ? `${b.nursingLevel}护理` : "未填等级";
      if (group === "surgery") key = surgeryBucket(b, today);
      if (group === "stay") key = stayBucket(b, today);
      if (group === "diet") key = b.dietOrder || "未填饮食";
      if (group === "allergy") key = b.allergy ? `过敏：${b.allergy}` : "无过敏史";
      if (group === "tag") {
        if (!b.tags.length) {
          const arr = map.get("无标记") ?? [];
          arr.push(b);
          map.set("无标记", arr);
        } else {
          for (const t of b.tags) {
            const arr = map.get(t.name) ?? [];
            arr.push(b);
            map.set(t.name, arr);
          }
        }
        continue;
      }
      const arr = map.get(key) ?? [];
      arr.push(b);
      map.set(key, arr);
    }
    const order =
      group === "level"
        ? LEVEL_ORDER.map((x) => `${x}护理`)
        : group === "surgery"
          ? SURGERY_ORDER
          : group === "stay"
            ? STAY_ORDER
            : [];
    const keys = [...map.keys()].sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia >= 0 || ib >= 0) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      return a.localeCompare(b, "zh");
    });
    return keys.map((key) => ({ key, title: key, beds: map.get(key) ?? [] }));
  }, [filtered, group, today]);

  const activeFilters = [level, diagnosis, surgery, stay, diet, allergy, tag, unreadOnly ? "未读" : ""].filter(Boolean).length;
  const classifyOn = open || activeFilters > 0;

  function clearFilters() {
    apply({
      level: "",
      diagnosis: "",
      surgery: "",
      stay: "",
      diet: "",
      allergy: "",
      tag: "",
      unreadOnly: false,
    });
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          className="min-w-[12rem] flex-1 rounded-2xl border border-[var(--line)] bg-white/90 px-4 py-3 text-base shadow-[0_8px_24px_rgba(15,58,95,0.04)]"
          placeholder="床号、姓名、住院号（找人）"
          value={q}
          onChange={(e) => apply({ q: e.target.value })}
        />
        <button
          type="button"
          onClick={() => apply({ open: !open })}
          className={`ui-btn min-h-12 px-5 ${
            classifyOn ? "ui-btn-clay" : "ui-btn-navy"
          }`}
        >
          档案归类{activeFilters ? ` · ${activeFilters}` : ""}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">快捷查看</span>
        <Chip
          on={surgery === "今日手术"}
          onClick={() => apply({ surgery: surgery === "今日手术" ? "" : "今日手术", open: true })}
        >
          今日手术 {shortcutCounts.todayOp}
        </Chip>
        <Chip on={surgery === "术后"} onClick={() => apply({ surgery: surgery === "术后" ? "" : "术后", open: true })}>
          术后 {shortcutCounts.postop}
        </Chip>
        <Chip
          on={stay === "住院超过 7 天"}
          onClick={() => apply({ stay: stay === "住院超过 7 天" ? "" : "住院超过 7 天", open: true })}
        >
          住院超过 7 天 {shortcutCounts.longStay}
        </Chip>
        <Chip on={level === "特级"} onClick={() => apply({ level: level === "特级" ? "" : "特级", open: true })}>
          特级护理 {shortcutCounts.special}
        </Chip>
      </div>
      {open ? (
        <section className="surface mt-3 space-y-3 rounded-2xl p-4 text-sm">
          <div>
            <p className="mb-2 font-semibold text-navy">按什么归类查看</p>
            <div className="flex flex-wrap gap-2">
              {GROUP_OPTIONS.map(([k, label]) => (
                <Chip key={k || "none"} on={group === k} onClick={() => apply({ group: k })}>
                  {label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-navy">筛选</p>
            <FilterRow label="护理等级">
              {LEVEL_ORDER.map((lv) => (
                <Chip key={lv} on={level === lv} onClick={() => apply({ level: level === lv ? "" : lv })}>
                  {lv}护理
                </Chip>
              ))}
            </FilterRow>
            <FilterRow label="手术日">
              {SURGERY_ORDER.map((s) => (
                <Chip key={s} on={surgery === s} onClick={() => apply({ surgery: surgery === s ? "" : s })}>
                  {s}
                </Chip>
              ))}
            </FilterRow>
            <FilterRow label="住院时间">
              {STAY_ORDER.map((s) => (
                <Chip key={s} on={stay === s} onClick={() => apply({ stay: stay === s ? "" : s })}>
                  {s}
                </Chip>
              ))}
            </FilterRow>
            <FilterRow label="诊断">
              {diagnoses.map((d) => (
                <Chip key={d} on={diagnosis === d} onClick={() => apply({ diagnosis: diagnosis === d ? "" : d })}>
                  {d}
                </Chip>
              ))}
            </FilterRow>
            <FilterRow label="饮食医嘱">
              {diets.map((d) => (
                <Chip key={d} on={diet === d} onClick={() => apply({ diet: diet === d ? "" : d })}>
                  {d}
                </Chip>
              ))}
            </FilterRow>
            <FilterRow label="过敏史">
              <Chip on={allergy === "有"} onClick={() => apply({ allergy: allergy === "有" ? "" : "有" })}>
                有过敏
              </Chip>
              <Chip on={allergy === "无"} onClick={() => apply({ allergy: allergy === "无" ? "" : "无" })}>
                无过敏
              </Chip>
            </FilterRow>
            <FilterRow label="标记组">
              {tagNames.map((t) => (
                <Chip key={t} on={tag === t} onClick={() => apply({ tag: tag === t ? "" : t })}>
                  {t}
                </Chip>
              ))}
              <Chip on={unreadOnly} onClick={() => apply({ unreadOnly: !unreadOnly })}>
                有未读
              </Chip>
            </FilterRow>
            {activeFilters ? (
              <button type="button" className="text-xs text-slate-500 underline" onClick={clearFilters}>
                清除筛选
              </button>
            ) : null}
          </div>
          <p className="text-xs text-slate-500">
            姓名、住院号只适合查找单人。交班和圈人优先按诊断、护理等级、手术日、住院天数、饮食、过敏、标记组归类。
          </p>
        </section>
      ) : null}
      <p className="mt-4 text-sm text-slate-500">
        当前 {filtered.length} / {beds.length} 床
        {group ? ` · 按${GROUP_OPTIONS.find(([k]) => k === group)?.[1] ?? ""}分组` : ""}
      </p>
      {filtered.length === 0 ? (
        <p className="mt-4 rounded-xl border bg-white p-8 text-center text-slate-600">
          没有符合的床，试试「今日手术 / 术后 / 住院超过 7 天」，或用住院号找人
        </p>
      ) : (
        groups.map((g) => (
          <div key={g.key || "all"} className="mt-4">
            {g.title ? (
              <h2 className="mb-2 text-sm font-semibold text-navy">
                {g.title}
                <span className="ml-2 font-normal text-slate-400">{g.beds.length} 人</span>
              </h2>
            ) : null}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {g.beds.map((b) => (
                <BedCard key={`${g.key}-${b.id}`} b={b} today={today} />
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );
}
