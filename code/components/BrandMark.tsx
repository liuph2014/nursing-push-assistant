export function BrandMark({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo.png"
        alt="首都医科大学宣武医院神经外科"
        className={compact ? "h-8 w-auto max-w-[220px] object-contain" : "h-11 w-auto max-w-full object-contain"}
      />
    </div>
  );
}
