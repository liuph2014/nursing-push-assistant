"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function PollRefresh({ seconds = 3 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    let busy = false;
    const t = setInterval(() => {
      if (document.visibilityState !== "visible" || busy) return;
      busy = true;
      router.refresh();
      window.setTimeout(() => {
        busy = false;
      }, seconds * 1000);
    }, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
