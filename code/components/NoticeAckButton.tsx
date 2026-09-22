"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function NoticeAckButton({ taskId, token }: { taskId: string; token?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await fetch(token ? "/api/p/notice-ack" : `/api/tasks/${taskId}/notice-ack`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: token ? JSON.stringify({ token, taskId }) : undefined,
          });
          router.refresh();
        })
      }
      className="rounded-lg bg-[#1A7A72] px-4 py-2 font-semibold text-white hover:bg-[#15685F] disabled:opacity-60"
    >
      {pending ? "提交中…" : token ? "已知晓" : "已告知"}
    </button>
  );
}
