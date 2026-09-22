"use client";

import { PostButton } from "./PostButton";

export function CiteButton({ id }: { id: string }) {
  return (
    <PostButton action="/api/content" body={{ citeId: id }} className="rounded bg-[#1A7A72] px-3 py-1 text-sm text-white">
      引用到本科
    </PostButton>
  );
}
