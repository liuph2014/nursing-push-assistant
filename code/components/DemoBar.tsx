"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { DEMO_STEPS, ROLE_LABEL, homeForRole, type Role } from "@/lib/demo";

const roles: Role[] = ["head_nurse", "primary_nurse", "nursing_admin", "qa_readonly"];

type Props = {
  role: Role;
  bedCode: number;
  patientUrl: string;
  dayOffset: number;
  notice?: string;
  nurseId?: string;
  nurses?: { id: string; name: string }[];
};

export function DemoBar({ role, bedCode, patientUrl, dayOffset, notice, nurseId, nurses }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const [resetHint, setResetHint] = useState(false);
  const [open, setOpen] = useState(false);

  function setRole(next: Role) {
    start(async () => {
      await fetch("/api/demo/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      const home = homeForRole(next);
      if (next === "nursing_admin" || next === "qa_readonly") router.push(home);
      else if (pathname.startsWith("/app/stats") || pathname.startsWith("/app/login")) router.push(home);
      else router.refresh();
    });
  }

  function setNurse(id: string) {
    start(async () => {
      await fetch("/api/demo/nurse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    });
  }

  function setBed(code: number) {
    start(async () => {
      await fetch("/api/demo/bed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      router.push(`/app/ward/${code}`);
      router.refresh();
    });
  }

  async function copyLink() {
    await navigator.clipboard.writeText(patientUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function reset() {
    if (!resetHint) {
      setResetHint(true);
      return;
    }
    start(async () => {
      await fetch("/api/demo/reset", { method: "POST" });
      setResetHint(false);
      router.push("/app/ward");
      router.refresh();
    });
  }

  function tick() {
    start(async () => {
      await fetch("/api/demo/tick", { method: "POST" });
      router.refresh();
    });
  }

  function execute() {
    start(async () => {
      await fetch("/api/demo/execute", { method: "POST" });
      router.refresh();
    });
  }

  useEffect(() => {
    if (!resetHint) return;
    const t = setTimeout(() => setResetHint(false), 8000);
    return () => clearTimeout(t);
  }, [resetHint]);

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-navy-deep/95 text-white backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 text-[13px]">
        <span className="font-medium tracking-[0.16em] text-white/55">DEMO</span>
        <div className="flex rounded-full bg-white/8 p-0.5">
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-full px-2.5 py-1 font-medium transition ${
                role === r ? "bg-white text-navy" : "text-white/75 hover:bg-white/10"
              }`}
            >
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
        {role === "primary_nurse" && nurses?.length ? (
          <select
            className="rounded-full border-0 bg-white/10 px-2 py-1 text-white"
            value={nurseId}
            onChange={(e) => setNurse(e.target.value)}
            aria-label="当前护士"
          >
            {nurses.map((n) => (
              <option key={n.id} value={n.id} className="text-navy">
                {n.name}
              </option>
            ))}
          </select>
        ) : null}
        <select
          className="rounded-full border-0 bg-white/10 px-2 py-1 text-white"
          value={bedCode}
          onChange={(e) => setBed(Number(e.target.value))}
          aria-label="当前床"
        >
          {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n} className="text-navy">
              {n} 床
            </option>
          ))}
        </select>
        <a
          className="rounded-full bg-teal px-3 py-1 font-semibold text-white hover:bg-[#15685F]"
          href={patientUrl}
          target="_blank"
          rel="noreferrer"
        >
          患者页
        </a>
        <button type="button" onClick={copyLink} className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/16">
          {copied ? "已复制" : "复制链接"}
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto rounded-full bg-white/10 px-3 py-1 hover:bg-white/16"
        >
          {open ? "收起演示工具" : "演示工具"}
        </button>
      </div>
      {open ? (
        <div className="space-y-2 border-t border-white/10 px-3 py-2.5 text-xs text-white/75">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={tick}
              disabled={pending}
              className="rounded-full bg-clay px-3 py-1 font-semibold text-white"
            >
              快进一天（已 +{dayOffset}）
            </button>
            <button type="button" onClick={execute} disabled={pending} className="rounded-full bg-white/12 px-3 py-1">
              执行到期任务
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={pending}
              className={`rounded-full px-3 py-1 font-semibold ${resetHint ? "bg-clay text-white" : "bg-white/12"}`}
            >
              {resetHint ? "再点一次确认重置" : "重置演示数据"}
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {DEMO_STEPS.map((s) => (
              <a key={s.id} href={s.href} title={s.hint} className="rounded-full bg-white/10 px-2.5 py-1 hover:bg-white/18">
                {s.label}
              </a>
            ))}
          </div>
          <p>
            主路径：套 1 床入院路径 → 读入院须知满 8 秒 → 防跌倒未读当面补讲 → 看板。
            {notice ? ` ${notice}` : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}
