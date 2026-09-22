import Link from "next/link";
import { getSettings } from "@/lib/queries";

export async function PatientNav({ token }: { token: string }) {
  const settings = await getSettings();
  const items = [
    { href: `/p/${token}/inbox`, label: "待学习" },
    { href: `/p/${token}/inbox?tab=done`, label: "已完成" },
    { href: `/p/${token}/center`, label: "宣教中心" },
    { href: `/p/${token}/zone`, label: settings.diseaseZoneName },
  ];
  return (
    <nav className="mb-4 flex flex-wrap gap-2 text-sm">
      {items.map((it) => (
        <Link key={it.href} href={it.href} className="rounded-full bg-white px-3 py-1 font-semibold text-[#0F3A5F] ring-1 ring-slate-200">
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
