"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DIAGNOSIS_OPTIONS, GENDER_OPTIONS } from "@/lib/profile-options";

export function WardJoinForm({
  wardToken,
  emptyBeds,
}: {
  wardToken: string;
  emptyBeds: number[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    patientName: "",
    gender: "男",
    age: "",
    hospitalNo: "",
    diagnosis: "",
    attendingDoctor: "",
    bedDoctor: "",
    admittedAt: new Date().toISOString().slice(0, 10),
    bedCode: emptyBeds[0] ? String(emptyBeds[0]) : "",
  });

  function submit(skip: boolean) {
    start(async () => {
      setErr("");
      const res = await fetch("/api/p/ward-join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wardToken,
          skip,
          ...form,
          age: Number(form.age) || 0,
          bedCode: form.bedCode ? Number(form.bedCode) : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; token?: string };
      if (!res.ok || !data.token) {
        setErr(data.error || "加入失败");
        return;
      }
      router.push(`/p/${data.token}/consent`);
    });
  }

  if (emptyBeds.length === 0) {
    return <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">暂无空床，请联系护士在后台安排床位后再扫码。</p>;
  }

  return (
    <div className="mt-4 space-y-3 text-sm">
      <label className="block">
        选择床位
        <select className="mt-1 w-full rounded border px-2 py-2" value={form.bedCode} onChange={(e) => setForm({ ...form, bedCode: e.target.value })}>
          {emptyBeds.map((c) => (
            <option key={c} value={c}>
              {c} 床
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        姓名
        <input className="mt-1 w-full rounded border px-2 py-2" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          性别
          <select className="mt-1 w-full rounded border px-2 py-2" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            {GENDER_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          年龄
          <input type="number" className="mt-1 w-full rounded border px-2 py-2" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
        </label>
      </div>
      <label className="block">
        住院号
        <input className="mt-1 w-full rounded border px-2 py-2" value={form.hospitalNo} onChange={(e) => setForm({ ...form, hospitalNo: e.target.value })} />
      </label>
      <label className="block">
        诊断
        <select className="mt-1 w-full rounded border px-2 py-2" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}>
          <option value="">请选择（可跳过）</option>
          {DIAGNOSIS_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        主诊医生
        <input className="mt-1 w-full rounded border px-2 py-2" value={form.attendingDoctor} onChange={(e) => setForm({ ...form, attendingDoctor: e.target.value })} />
      </label>
      <label className="block">
        管床医生
        <input className="mt-1 w-full rounded border px-2 py-2" value={form.bedDoctor} onChange={(e) => setForm({ ...form, bedDoctor: e.target.value })} />
      </label>
      <label className="block">
        入院日期
        <input type="date" className="mt-1 w-full rounded border px-2 py-2" value={form.admittedAt} onChange={(e) => setForm({ ...form, admittedAt: e.target.value })} />
      </label>
      {err ? <p className="text-red-600">{err}</p> : null}
      <button
        type="button"
        disabled={pending}
        className="min-h-12 w-full rounded-lg bg-[#0F3A5F] font-semibold text-white disabled:opacity-60"
        onClick={() => submit(false)}
      >
        {pending ? "提交中…" : "提交并进入"}
      </button>
      <button type="button" disabled={pending} className="w-full rounded-lg border py-2 text-slate-600 disabled:opacity-60" onClick={() => submit(true)}>
        跳过，由护士后台填写
      </button>
    </div>
  );
}
