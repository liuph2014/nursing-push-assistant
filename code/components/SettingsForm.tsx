"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function SettingsForm({
  autoDischargeDays,
  hotline,
  hotlineLabel,
  requireIntakeForm,
  requirePushConfirm,
  diseaseZoneName,
  effectiveReadSeconds,
  consultEnabled,
}: {
  autoDischargeDays: number;
  hotline: string;
  hotlineLabel: string;
  requireIntakeForm: boolean;
  requirePushConfirm: boolean;
  diseaseZoneName: string;
  effectiveReadSeconds: number;
  consultEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    autoDischargeDays,
    hotline,
    hotlineLabel,
    requireIntakeForm,
    requirePushConfirm,
    diseaseZoneName,
    effectiveReadSeconds,
    consultEnabled,
  });

  return (
    <form
      className="mt-4 space-y-3 rounded-xl border bg-white p-5 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
          router.refresh();
        });
      }}
    >
      <label className="block">
        自动出院天数
        <input
          type="number"
          className="mt-1 w-full rounded border px-2 py-1"
          value={form.autoDischargeDays}
          onChange={(e) => setForm({ ...form, autoDischargeDays: Number(e.target.value) })}
        />
      </label>
      <label className="block">
        有效阅读秒数
        <input
          type="number"
          min={1}
          max={300}
          className="mt-1 w-full rounded border px-2 py-1"
          value={form.effectiveReadSeconds}
          onChange={(e) => setForm({ ...form, effectiveReadSeconds: Number(e.target.value) || 8 })}
        />
        <span className="mt-1 block text-xs text-slate-500">患者打开文章累计停留达到该秒数记为有效阅读（当前 {form.effectiveReadSeconds} 秒）</span>
      </label>
      <label className="block">
        热线名称
        <input className="mt-1 w-full rounded border px-2 py-1" value={form.hotlineLabel} onChange={(e) => setForm({ ...form, hotlineLabel: e.target.value })} />
      </label>
      <label className="block">
        热线电话
        <input className="mt-1 w-full rounded border px-2 py-1" value={form.hotline} onChange={(e) => setForm({ ...form, hotline: e.target.value })} />
      </label>
      <label className="block">
        默认专病专区名称
        <input className="mt-1 w-full rounded border px-2 py-1" value={form.diseaseZoneName} onChange={(e) => setForm({ ...form, diseaseZoneName: e.target.value })} />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={form.requireIntakeForm} onChange={(e) => setForm({ ...form, requireIntakeForm: e.target.checked })} />
        扫码后先填联系人（建议用 2 床演示）
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={form.requirePushConfirm} onChange={(e) => setForm({ ...form, requirePushConfirm: e.target.checked })} />
        全科群发须护士长确认
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={form.consultEnabled} onChange={(e) => setForm({ ...form, consultEnabled: e.target.checked })} />
        开放患者在线问诊/留言（出院后仍可留言）
      </label>
      <button disabled={pending} className="rounded bg-[#0F3A5F] px-4 py-2 font-semibold text-white">
        {pending ? "保存中…" : "保存设置"}
      </button>
    </form>
  );
}
