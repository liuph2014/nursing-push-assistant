"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";

export function PatientShell({
  token,
  bedLabel,
  zoneName,
  children,
}: {
  token: string;
  bedLabel: string;
  zoneName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hideTabs =
    pathname.includes("/consent") ||
    pathname.includes("/intake") ||
    pathname.includes("/articles/") ||
    pathname.includes("/read/");
  const done = searchParams.get("tab") === "done";

  const tabs = [
    { href: `/p/${token}/inbox`, label: "待学习", on: pathname.endsWith("/inbox") && !done },
    { href: `/p/${token}/inbox?tab=done`, label: "已完成", on: pathname.endsWith("/inbox") && done },
    { href: `/p/${token}/center`, label: "宣教中心", on: pathname.includes("/center") },
    { href: `/p/${token}/zone`, label: zoneName, on: pathname.includes("/zone") },
  ];

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <BrandMark compact />
          <p className="shrink-0 text-xs font-medium text-navy">{bedLabel}</p>
        </div>
      </header>
      <div className={hideTabs ? "" : "pb-24"}>{children}</div>
      {hideTabs ? null : (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-white/95 px-2 py-2 backdrop-blur-xl">
          <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-2xl px-2 py-2.5 text-center text-[12px] font-semibold leading-tight ${
                  t.on ? "bg-navy text-white" : "text-slate-500"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
