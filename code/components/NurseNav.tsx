"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { LogoutButton } from "@/components/LogoutButton";
import { NAV_GROUPS, ROLE_LABEL, homeForRole, type Role } from "@/lib/demo";

export function NurseNav({ role, name }: { role: Role; name: string }) {
  const pathname = usePathname();
  const home = homeForRole(role);
  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((it) => it.roles.includes(role)),
  })).filter((g) => g.items.length);

  return (
    <aside className="relative flex w-full shrink-0 flex-col border-b border-[var(--line)] bg-white/85 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:w-[17.5rem] lg:border-b-0 lg:border-r">
      <Link href={home} className="block border-b border-[var(--line)] px-5 py-5">
        <BrandMark />
        <p className="mt-3 font-serif text-lg text-navy">护理宣教作业台</p>
        <p className="mt-0.5 text-xs tracking-wide text-slate-500">宣武医院 · 神经外科</p>
        <p className="mt-3 inline-flex rounded-full bg-navy/5 px-2.5 py-1 text-[11px] font-medium text-navy">
          {name} · {ROLE_LABEL[role]}
        </p>
        <LogoutButton />
      </Link>
      <nav className="flex gap-4 overflow-x-auto px-3 py-3 lg:block lg:flex-1 lg:space-y-5 lg:overflow-y-auto lg:px-4 lg:py-5">
        {groups.map((g) => (
          <div key={g.id} className="min-w-max lg:min-w-0">
            <p className="mb-1.5 px-2 text-[11px] font-semibold tracking-[0.18em] text-slate-400">{g.label}</p>
            <div className="flex gap-1 lg:flex-col">
              {g.items.map((it) => {
                const on = pathname === it.href || pathname.startsWith(`${it.href}/`);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    title={it.hint}
                    className={`rounded-xl px-3 py-2.5 text-sm transition ${
                      on
                        ? "bg-navy text-white shadow-[0_8px_20px_rgba(15,58,95,0.16)]"
                        : "text-slate-600 hover:bg-navy/5 hover:text-navy"
                    }`}
                  >
                    <span className="font-medium">{it.label}</span>
                    <span className={`mt-0.5 hidden text-[11px] lg:block ${on ? "text-white/70" : "text-slate-400"}`}>
                      {it.hint}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="relative mt-auto hidden overflow-hidden border-t border-[var(--line)] lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/campus.jpg" alt="" className="h-28 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/70 to-navy/10" />
        <p className="absolute bottom-3 left-4 right-4 text-[11px] leading-5 text-white/85">首都医科大学宣武医院神经外科</p>
      </div>
    </aside>
  );
}
