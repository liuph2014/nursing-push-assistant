"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function LoginForm() {
  const router = useRouter();
  const [staffNo, setStaffNo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        start(async () => {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ staffNo, password }),
          });
          const data = (await res.json().catch(() => ({}))) as { error?: string; home?: string };
          if (!res.ok) {
            setError(data.error || "登录失败");
            return;
          }
          router.push(data.home || "/app/ward");
          router.refresh();
        });
      }}
    >
      <label className="block text-sm text-slate-600">
        工号
        <input
          className="mt-1.5 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base text-ink"
          value={staffNo}
          autoComplete="username"
          onChange={(e) => setStaffNo(e.target.value)}
        />
      </label>
      <label className="block text-sm text-slate-600">
        密码
        <input
          type="password"
          className="mt-1.5 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base text-ink"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error ? <p className="text-sm text-[#D32F2F]">{error}</p> : null}
      <button disabled={pending} className="ui-btn ui-btn-navy mt-2 w-full py-3.5 text-base">
        {pending ? "进入中…" : "进入作业台"}
      </button>
    </form>
  );
}
