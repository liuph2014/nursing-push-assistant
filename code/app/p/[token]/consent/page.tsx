import { stayByToken, getSettings } from "@/lib/queries";
import { ConsentButton } from "@/components/ConsentButton";

export default async function ConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const stay = await stayByToken(token);
  const settings = await getSettings();
  if (!stay) {
    return (
      <main className="px-6 py-16 text-center">
        <h1 className="font-serif text-xl text-navy">码已失效，请找护士</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md">
      <div className="relative h-44 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/campus.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/20 to-navy/25" />
      </div>
      <div className="-mt-8 px-5 pb-10">
        <p className="text-sm text-teal">宣武演示病区 · {stay.bed.code} 床</p>
        <h1 className="mt-2 font-serif text-3xl text-navy">健康教育知情提示</h1>
        <p className="mt-4 leading-7 text-slate-600">
          {settings.consentText ||
            "护士将通过本页向您推送住院期间的健康教育内容。内容仅供了解住院注意事项，不能替代当面指导。您同意后即可查看本科室宣教。"}
        </p>
        <ConsentButton token={token} />
        <p className="mt-8 text-center text-xs text-slate-400">演示数据 · 扫码即视为同意接收宣教</p>
      </div>
    </main>
  );
}
