import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4" style={{ animation: "rise 0.45s ease both" }}>
      <div className="min-w-0">
        {kicker ? <p className="text-[11px] font-medium tracking-[0.22em] text-teal">{kicker}</p> : null}
        <h1 className="mt-1 font-serif text-[1.85rem] font-semibold tracking-tight text-navy">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
