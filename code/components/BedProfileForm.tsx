"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ALLERGY_OPTIONS,
  DIAGNOSIS_OPTIONS,
  DIET_OPTIONS,
  GENDER_OPTIONS,
  NURSING_LEVEL_OPTIONS,
} from "@/lib/profile-options";

export function BedProfileForm({
  bedId,
  patientName,
  gender,
  age,
  hospitalNo,
  admittedAt,
  diagnosis,
  nursingLevel,
  dietOrder,
  allergy,
  contactName,
  contactPhone,
  attendingDoctor,
  bedDoctor,
  surgeryAt,
  primaryNurseId,
  nurseOptions,
  canEdit,
  isHead,
}: {
  bedId: string;
  patientName: string;
  gender: string;
  age: number;
  hospitalNo: string;
  admittedAt: string;
  diagnosis: string;
  nursingLevel: string;
  dietOrder: string;
  allergy: string;
  contactName: string;
  contactPhone: string;
  attendingDoctor: string;
  bedDoctor: string;
  surgeryAt: string;
  primaryNurseId: string;
  nurseOptions: { id: string; label: string }[];
  canEdit: boolean;
  isHead: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const diagnosisOptions = Array.from(new Set([...DIAGNOSIS_OPTIONS, diagnosis].filter(Boolean)));
  const dietOptions = Array.from(new Set([...DIET_OPTIONS, dietOrder].filter(Boolean)));
  const allergyOptions = Array.from(new Set([...ALLERGY_OPTIONS, allergy || "无"].filter(Boolean)));
  const [form, setForm] = useState({
    patientName,
    gender: gender || "男",
    age: String(age || ""),
    hospitalNo,
    admittedAt,
    diagnosis,
    nursingLevel: nursingLevel || "一级",
    dietOrder: dietOrder || "普食",
    allergy: allergy || "无",
    contactName,
    contactPhone,
    attendingDoctor: attendingDoctor || "",
    bedDoctor: bedDoctor || "",
    surgeryAt,
    primaryNurseId: primaryNurseId || nurseOptions[0]?.id || "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (!canEdit) {
    return (
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-slate-500">姓名</dt>
        <dd>{patientName || "—"}</dd>
        <dt className="text-slate-500">性别 / 年龄</dt>
        <dd>
          {gender || "—"} · {age ? `${age} 岁` : "—"}
        </dd>
        <dt className="text-slate-500">住院号</dt>
        <dd>{hospitalNo || "—"}</dd>
        <dt className="text-slate-500">入科日</dt>
        <dd>{admittedAt || "—"}</dd>
        <dt className="text-slate-500">诊断</dt>
        <dd>{diagnosis || "—"}</dd>
        <dt className="text-slate-500">护理等级</dt>
        <dd>{nursingLevel || "—"}</dd>
        <dt className="text-slate-500">饮食医嘱</dt>
        <dd>{dietOrder || "—"}</dd>
        <dt className="text-slate-500">过敏史</dt>
        <dd>{allergy || "无"}</dd>
        <dt className="text-slate-500">手术日</dt>
        <dd>{surgeryAt || "未排"}</dd>
        <dt className="text-slate-500">责任护士</dt>
        <dd>{nurseOptions.find((n) => n.id === primaryNurseId)?.label || "—"}</dd>
        <dt className="text-slate-500">联系人（选填）</dt>
        <dd>
          {contactName || "—"} {contactPhone}
        </dd>
        <dt className="text-slate-500">主诊 / 管床医生</dt>
        <dd>
          {attendingDoctor || "—"} / {bedDoctor || "—"}
        </dd>
        <p className="col-span-2 mt-1 text-xs text-amber-700">
          非责任床或当前角色只读，无法编辑档案。请切换到责任护士账号进入分管床。
        </p>
      </dl>
    );
  }

  return (
    <form
      className="mt-3 grid grid-cols-2 gap-3 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setMsg("");
          const res = await fetch(`/api/beds/${bedId}/profile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...form,
              allergy: form.allergy === "无" ? "" : form.allergy,
              age: Number(form.age) || 0,
            }),
          });
          if (!res.ok) {
            const data = (await res.json().catch(() => ({}))) as { error?: string };
            setMsg(data.error || "保存失败");
            return;
          }
          setMsg("已保存");
          router.refresh();
        });
      }}
    >
      <label className="block">
        姓名
        <input className="mt-1 w-full rounded border px-2 py-1" value={form.patientName} onChange={(e) => set("patientName", e.target.value)} />
      </label>
      <label className="block">
        性别
        <select className="mt-1 w-full rounded border px-2 py-1" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
          {GENDER_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        年龄
        <input
          type="number"
          min={0}
          max={120}
          className="mt-1 w-full rounded border px-2 py-1"
          value={form.age}
          onChange={(e) => set("age", e.target.value)}
        />
      </label>
      <label className="block">
        住院号
        <input className="mt-1 w-full rounded border px-2 py-1" value={form.hospitalNo} onChange={(e) => set("hospitalNo", e.target.value)} />
      </label>
      <label className="block">
        入科日
        <input type="date" className="mt-1 w-full rounded border px-2 py-1" value={form.admittedAt} onChange={(e) => set("admittedAt", e.target.value)} />
      </label>
      <label className="block">
        诊断
        <select className="mt-1 w-full rounded border px-2 py-1" value={form.diagnosis} onChange={(e) => set("diagnosis", e.target.value)}>
          <option value="">请选择</option>
          {diagnosisOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        护理等级
        <select className="mt-1 w-full rounded border px-2 py-1" value={form.nursingLevel} onChange={(e) => set("nursingLevel", e.target.value)}>
          {NURSING_LEVEL_OPTIONS.map((lv) => (
            <option key={lv} value={lv}>
              {lv}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        饮食医嘱
        <select className="mt-1 w-full rounded border px-2 py-1" value={form.dietOrder} onChange={(e) => set("dietOrder", e.target.value)}>
          {dietOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <label className="col-span-2 block">
        过敏史
        <select className="mt-1 w-full rounded border px-2 py-1" value={form.allergy || "无"} onChange={(e) => set("allergy", e.target.value)}>
          {allergyOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        主诊医生
        <input className="mt-1 w-full rounded border px-2 py-1" value={form.attendingDoctor} onChange={(e) => set("attendingDoctor", e.target.value)} />
      </label>
      <label className="block">
        管床医生
        <input className="mt-1 w-full rounded border px-2 py-1" value={form.bedDoctor} onChange={(e) => set("bedDoctor", e.target.value)} />
      </label>
      <label className="block">
        手术日
        <input type="date" className="mt-1 w-full rounded border px-2 py-1" value={form.surgeryAt} onChange={(e) => set("surgeryAt", e.target.value)} />
      </label>
      <label className="block">
        联系人电话
        <input className="mt-1 w-full rounded border px-2 py-1" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
      </label>
      <label className="col-span-2 block">
        联系人（选填）
        <input className="mt-1 w-full rounded border px-2 py-1" value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
      </label>
      {isHead ? (
        <label className="col-span-2 block">
          责任护士
          <select
            className="mt-1 w-full rounded border px-2 py-1"
            value={form.primaryNurseId}
            onChange={(e) => set("primaryNurseId", e.target.value)}
          >
            {nurseOptions.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <button
        disabled={pending}
        className="col-span-2 min-h-12 rounded-lg bg-[#0F3A5F] text-base font-semibold text-white disabled:opacity-60"
      >
        {pending ? "保存中…" : "保存档案"}
      </button>
      {msg ? <p className="col-span-2 text-[#1A7A72]">{msg}</p> : null}
    </form>
  );
}
