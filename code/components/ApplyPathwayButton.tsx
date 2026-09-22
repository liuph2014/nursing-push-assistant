"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ApplyPathwayButton({
  bedId,
  pathways,
}: {
  bedId: string;
  pathways: { id: string; name: string; status: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const active = pathways.filter((p) => p.status === "active");
  const [pathwayId, setPathwayId] = useState(active[0]?.id ?? pathways[0]?.id ?? "");

  return (
    <div>
      {active.length > 1 ? (
        <select
          className="mb-2 w-full rounded border px-3 py-2"
          value={pathwayId}
          onChange={(e) => setPathwayId(e.target.value)}
        >
          {active.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      ) : null}
      <button
        type="button"
        disabled={pending || !pathwayId}
        onClick={() =>
          start(async () => {
            setErr("");
            const res = await fetch(`/api/beds/${bedId}/apply-pathway`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pathwayId }),
            });
            if (!res.ok) {
              const data = (await res.json().catch(() => ({}))) as { error?: string };
              setErr(data.error || "没有权限或路径未启用");
              return;
            }
            router.refresh();
          })
        }
        className="w-full rounded-lg bg-[#C45C26] px-4 py-3 text-lg font-bold text-white hover:bg-[#A84C1F] disabled:opacity-60"
      >
        {pending ? "正在套用…" : "套用入院路径"}
      </button>
      {err ? <p className="mt-2 text-sm text-red-700">{err}</p> : null}
    </div>
  );
}
