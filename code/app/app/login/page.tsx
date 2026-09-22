import { LoginForm } from "@/components/LoginForm";
import { BrandMark } from "@/components/BrandMark";
import { ensureSeed } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  await ensureSeed();
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
      <section className="relative hidden min-h-[42vh] overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/campus.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-deep/80 via-navy/55 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <div className="rounded-2xl bg-white/95 px-5 py-4 shadow-lg">
            <BrandMark />
          </div>
          <div>
            <p className="text-sm tracking-[0.28em] text-white/70">NEUROSURGERY · NURSING</p>
            <h1 className="mt-3 max-w-md font-serif text-4xl leading-tight">把宣教做成可交接的护理作业</h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/80">
              床位归类、路径推送、有效阅读与当面补讲，在同一条作业台上完成。
            </p>
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <BrandMark />
          </div>
          <p className="mt-8 text-[11px] font-medium tracking-[0.22em] text-teal">宣武医院神经外科</p>
          <h2 className="mt-2 font-serif text-3xl text-navy">医护登录</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">使用工号和密码进入护理宣教作业台。身份由账号决定。</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
