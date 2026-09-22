"use client";

export function PrintButton({ label = "导出 PDF（打印）" }: { label?: string }) {
  return (
    <button type="button" className="text-sm text-[#0F3A5F] underline" onClick={() => window.print()}>
      {label}
    </button>
  );
}
