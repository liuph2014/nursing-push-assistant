"use client";

import { PostButton } from "./PostButton";

export function StayActions({
  bedId,
  canEdit,
  discharged,
  emptyBeds,
}: {
  bedId: string;
  canEdit: boolean;
  discharged: boolean;
  emptyBeds: { code: number }[];
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {!discharged && canEdit ? (
        <PostButton
          action={`/api/beds/${bedId}/discharge`}
          className="rounded bg-slate-700 px-3 py-2 text-sm font-semibold text-white"
        >
          办理出院
        </PostButton>
      ) : null}
      {canEdit && emptyBeds.length > 0 ? (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          {emptyBeds.map((b) => (
            <PostButton
              key={b.code}
              action={`/api/beds/${bedId}/transfer`}
              body={{ toCode: b.code }}
              className="rounded bg-white px-3 py-2 text-sm font-semibold text-[#0F3A5F] ring-1 ring-slate-200"
            >
              转到 {b.code} 床
            </PostButton>
          ))}
        </form>
      ) : null}
    </div>
  );
}
