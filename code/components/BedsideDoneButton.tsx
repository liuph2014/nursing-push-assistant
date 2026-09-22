"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function BedsideDoneButton({ taskId, highlight }: { taskId: string; highlight?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await fetch(`/api/tasks/${taskId}/bedside-done`, { method: "POST" });
          router.refresh();
        })
      }
      className="rounded-lg bg-[#1A7A72] px-4 py-2 font-semibold text-white hover:bg-[#15685F] disabled:opacity-60"
      id={highlight ? "bedside-done" : undefined}
    >
      {pending ? "提交中…" : "已当面完成"}
    </button>
  );
}
