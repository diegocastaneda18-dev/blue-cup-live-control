import type { ReactNode } from "react";

/** Tailwind classes for catch status pills (premium dark palette). */
export function catchStatusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "submitted") return "border-sky-400/45 bg-sky-500/18 text-sky-100";
  if (s === "pending_review") return "border-amber-400/45 bg-amber-500/18 text-amber-100";
  if (s === "approved") return "border-emerald-400/45 bg-emerald-500/18 text-emerald-100";
  if (s === "rejected") return "border-red-400/45 bg-red-500/18 text-red-100";
  if (s === "penalized") return "border-rose-400/45 bg-rose-500/18 text-rose-100";
  if (s === "official") return "border-cyan-400/45 bg-cyan-500/20 text-cyan-100";
  if (s === "more_evidence_required") return "border-orange-400/45 bg-orange-500/18 text-orange-100";
  if (s === "protested") return "border-violet-400/45 bg-violet-500/18 text-violet-100";
  if (s === "draft") return "border-slate-500/45 bg-slate-600/25 text-slate-200";
  return "border-white/20 bg-white/8 text-slate-200";
}

export function formatCatchStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

type CatchStatusBadgeProps = {
  status: string;
  size?: "sm" | "md";
  className?: string;
  children?: ReactNode;
};

export function CatchStatusBadge({ status, size = "sm", className = "", children }: CatchStatusBadgeProps) {
  const sizeCls = size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold capitalize ${sizeCls} ${catchStatusBadgeClass(status)} ${className}`.trim()}
    >
      {children ?? formatCatchStatusLabel(status)}
    </span>
  );
}
