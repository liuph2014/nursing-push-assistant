"use client";

import { useEffect, useRef, useState } from "react";

const TICK = 2000;

export function ReadHeartbeat({
  token,
  articleId,
  initialDwell,
  threshold,
}: {
  token: string;
  articleId: string;
  initialDwell: number;
  threshold: number;
}) {
  const [dwell, setDwell] = useState(initialDwell);
  const [status, setStatus] = useState(initialDwell >= threshold ? "read" : "reading");
  const visible = useRef(true);

  useEffect(() => {
    const onVis = () => {
      visible.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);
    const t = setInterval(async () => {
      if (!visible.current || status === "read") return;
      const res = await fetch("/api/p/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, articleId }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { dwellMs: number; status: string };
      setDwell(data.dwellMs);
      if (data.status === "read") setStatus("read");
    }, TICK);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(t);
    };
  }, [articleId, status, token]);

  const remain = Math.max(0, Math.ceil((threshold - dwell) / 1000));

  return (
    <div className="sticky top-0 z-10 bg-[#1A7A72] px-4 py-2 text-center text-sm font-medium text-white">
      {status === "read"
        ? "已记为有效阅读，可返回待学习"
        : `请停留阅读，大约还有 ${remain} 秒记为已读`}
    </div>
  );
}
