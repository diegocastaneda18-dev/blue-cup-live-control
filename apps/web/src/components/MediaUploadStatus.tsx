import type { MediaUploadStatus } from "../lib/mediaUpload";
import { mediaStatusLabel, mediaStatusTone } from "../lib/mediaUpload";

export function MediaUploadStatusBadge({
  status,
  className = ""
}: {
  status?: MediaUploadStatus;
  className?: string;
}) {
  const tone = mediaStatusTone(status);
  const toneClass =
    tone === "success"
      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
      : tone === "warning"
        ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
        : tone === "error"
          ? "border-red-400/40 bg-red-500/15 text-red-100"
          : "border-white/15 bg-white/5 text-slate-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${toneClass} ${className}`.trim()}
    >
      {mediaStatusLabel(status)}
    </span>
  );
}

export function UploadProgressBar({
  percent,
  label
}: {
  percent: number;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3">
      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
        <span>{label}</span>
        <span className="font-semibold tabular-nums text-amber-100">{percent}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}
