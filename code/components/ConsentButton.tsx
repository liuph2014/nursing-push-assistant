"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function ConsentButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await fetch(`/api/p/${token}/consent`, { method: "POST" });
          router.push(`/p/${token}/inbox`);
          router.refresh();
        })
      }
      className="ui-btn ui-btn-clay mt-8 w-full py-4 text-lg"
    >
      {pending ? "进入中…" : "同意并进入"}
    </button>
  );
}
