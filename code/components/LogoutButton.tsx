"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="mt-3 text-xs text-slate-500 underline"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/app/login");
        router.refresh();
      }}
    >
      退出登录
    </button>
  );
}
