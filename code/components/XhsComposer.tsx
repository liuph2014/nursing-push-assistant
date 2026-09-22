"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { encodeNoteImages, noteImages } from "@/lib/note";

const TEXT_BG = ["#FFF4E8", "#F3EEE8", "#E8F4F2", "#F6E8EE"];

export function XhsComposer({
  article,
  categories,
}: {
  article?: {
    id: string;
    title: string;
    summary: string;
    body: string;
    categoryId: string | null;
    keywords: string;
    mediaType: string;
    mediaUrl: string;
  };
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const existingImages = article ? noteImages(article.mediaType, article.mediaUrl) : [];
  const [mode, setMode] = useState<"text" | "image">(existingImages.length ? "image" : "text");
  const [images, setImages] = useState<string[]>(existingImages);
  const [title, setTitle] = useState(article?.title ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [categoryId, setCategoryId] = useState(article?.categoryId ?? categories[0]?.id ?? "");
  const [keywords, setKeywords] = useState(article?.keywords ?? "");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [uploading, setUploading] = useState(false);

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    setUploading(true);
    setErr("");
    try {
      const next = [...images];
      for (const file of Array.from(list).slice(0, 9 - next.length)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          setErr(data.error || "图片上传失败");
          break;
        }
        next.push(data.url);
      }
      setImages(next.slice(0, 9));
      if (next.length) setMode("image");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function resetForm() {
    setTitle("");
    setBody("");
    setImages([]);
    setKeywords("");
    setMode("text");
    setErr("");
    setOk("");
  }

  return (
    <form
      className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[2rem] border-[10px] border-zinc-800 bg-white shadow-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setErr("");
          setOk("");
          if (!title.trim() && !body.trim()) {
            setErr("请填写标题或正文");
            return;
          }
          if (mode === "image" && images.length === 0) {
            setErr("图文笔记请至少添加一张图，或改成纯文字");
            return;
          }
          const mediaType = mode === "image" && images.length ? "image" : "text";
          const res = await fetch("/api/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: article?.id,
              title: title.trim() || body.trim().slice(0, 24),
              summary: body.trim().slice(0, 48),
              body: body.trim() || title.trim(),
              categoryId,
              keywords,
              scope: "department",
              mediaType,
              mediaUrl: mediaType === "image" ? encodeNoteImages(images) : "",
            }),
          });
          if (!res.ok) {
            const data = (await res.json().catch(() => ({}))) as { error?: string };
            setErr(data.error || "发布失败");
            return;
          }
          setOk("已发布，责任护士可在右侧搜索并分发给患者");
          if (!article) resetForm();
          router.refresh();
        });
      }}
    >
      <header className="flex items-center justify-between border-b px-3 py-2.5">
        <button type="button" className="text-sm text-slate-500" onClick={resetForm}>
          取消
        </button>
        <p className="text-sm font-semibold">发布笔记</p>
        <button
          disabled={pending || uploading}
          className="rounded-full bg-[#FF2442] px-3.5 py-1 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "发布中" : "发布"}
        </button>
      </header>
      <div className="flex border-b text-sm">
        <button
          type="button"
          className={`flex-1 py-2 ${mode === "text" ? "font-semibold text-[#FF2442]" : "text-slate-500"}`}
          onClick={() => setMode("text")}
        >
          纯文字
        </button>
        <button
          type="button"
          className={`flex-1 py-2 ${mode === "image" ? "font-semibold text-[#FF2442]" : "text-slate-500"}`}
          onClick={() => setMode("image")}
        >
          图文
        </button>
      </div>
      {mode === "image" ? (
        <div className="grid grid-cols-3 gap-1 bg-slate-50 p-2">
          {images.map((src, i) => (
            <div key={`${src}-${i}`} className="relative aspect-[3/4] overflow-hidden rounded-lg bg-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white"
                onClick={() => setImages(images.filter((_, idx) => idx !== i))}
              >
                ×
              </button>
            </div>
          ))}
          {images.length < 9 ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex aspect-[3/4] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-xs text-slate-500"
            >
              {uploading ? "上传中…" : "+ 添加图片"}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="px-3 pt-3">
          <div className="rounded-2xl px-4 py-6 text-sm" style={{ background: TEXT_BG[title.length % TEXT_BG.length] }}>
            <p className="text-lg font-bold leading-snug text-slate-900">{title || "纯文字笔记预览"}</p>
            <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-slate-700">{body || "写给患者看的一段话，发布后全科责任护士都能搜到。"}</p>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
      <div className="space-y-2 p-3">
        <input
          className="w-full border-none text-base font-semibold outline-none placeholder:text-slate-400"
          placeholder="填写标题，更容易被搜到"
          maxLength={40}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="h-36 w-full resize-none border-none text-sm leading-6 outline-none placeholder:text-slate-400"
          placeholder="添加正文。可只发文字，也可切到「图文」配图。"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={`rounded-full px-2.5 py-1 text-xs ${categoryId === c.id ? "bg-[#FF2442] text-white" : "bg-slate-100 text-slate-600"}`}
            >
              #{c.name}
            </button>
          ))}
        </div>
        <input
          className="w-full rounded-lg bg-slate-50 px-2 py-1.5 text-xs outline-none"
          placeholder="检索词，如 跌倒、吞咽，责任护士按这个搜"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        {ok ? <p className="text-sm text-[#1A7A72]">{ok}</p> : null}
      </div>
    </form>
  );
}
