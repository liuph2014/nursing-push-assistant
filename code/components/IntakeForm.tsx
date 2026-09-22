"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function IntakeForm({ token, name, phone }: { token: string; name: string; phone: string }) {
  const router = useRouter();
  const [contactName, setName] = useState(name);
  const [contactPhone, setPhone] = useState(phone);
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-6 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          await fetch(`/api/p/${token}/intake`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contactName, contactPhone }),
          });
          router.push(`/p/${token}/inbox`);
          router.refresh();
        });
      }}
    >
      <label className="block text-sm">
        联系人姓名
        <input required className="mt-1 w-full rounded border px-3 py-2" value={contactName} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block text-sm">
        联系电话
        <input required className="mt-1 w-full rounded border px-3 py-2" value={contactPhone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <button disabled={pending} className="w-full rounded-xl bg-[#C45C26] py-3 font-bold text-white">
        {pending ? "提交中…" : "提交后进入宣教"}
      </button>
    </form>
  );
}
