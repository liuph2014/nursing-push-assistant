"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function PostButton({
  action,
  children,
  className,
  body,
  disabled,
  method = "POST",
  style,
}: {
  action: string;
  children: React.ReactNode;
  className?: string;
  body?: unknown;
  disabled?: boolean;
  method?: string;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  return (
    <span className="inline-block">
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() =>
          start(async () => {
            setErr("");
            const res = await fetch(action, {
              method,
              headers: { "Content-Type": "application/json" },
              body: body === undefined ? undefined : JSON.stringify(body),
            });
            if (!res.ok) {
              const data = (await res.json().catch(() => ({}))) as { error?: string };
              setErr(data.error || "操作未成功");
              return;
            }
            router.refresh();
          })
        }
        className={className}
        style={style}
      >
        {pending ? "处理中…" : children}
      </button>
      {err ? <p className="mt-1 text-sm text-red-700">{err}</p> : null}
    </span>
  );
}
