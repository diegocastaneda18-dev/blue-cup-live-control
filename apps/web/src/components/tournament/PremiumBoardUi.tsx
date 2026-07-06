import type { ReactNode } from "react";

const PODIUM_RANK: Record<
  1 | 2 | 3,
  { ring: string; glow: string; text: string; gradient: string; label: string }
> = {
  1: {
    ring: "ring-amber-400/45",
    glow: "shadow-amber-500/20",
    text: "text-amber-100",
    gradient: "from-amber-500/25 via-amber-500/10 to-transparent",
    label: "1st"
  },
  2: {
    ring: "ring-slate-300/35",
    glow: "shadow-slate-400/15",
    text: "text-slate-100",
    gradient: "from-slate-400/20 via-slate-400/8 to-transparent",
    label: "2nd"
  },
  3: {
    ring: "ring-amber-700/40",
    glow: "shadow-amber-900/25",
    text: "text-amber-200/95",
    gradient: "from-amber-800/25 via-amber-900/10 to-transparent",
    label: "3rd"
  }
};

export function RankEmblem({
  rank,
  size = "md"
}: {
  rank: number;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const podium = rank >= 1 && rank <= 3 ? PODIUM_RANK[rank as 1 | 2 | 3] : null;
  const sizeClass =
    size === "xl"
      ? "h-16 w-16 text-2xl"
      : size === "lg"
        ? "h-14 w-14 text-xl"
        : size === "sm"
          ? "h-9 w-9 text-sm"
          : "h-11 w-11 text-lg";

  if (podium) {
    return (
      <div
        className={`flex shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-b ${podium.gradient} ring-1 ${podium.ring} shadow-lg ${podium.glow} ${sizeClass} font-bold tabular-nums ${podium.text}`}
        aria-label={`Rank ${rank}`}
      >
        <span className="leading-none">{rank}</span>
        <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider opacity-80">{podium.label}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] font-semibold tabular-nums text-slate-300 ${sizeClass}`}
      aria-label={`Rank ${rank}`}
    >
      {rank}
    </div>
  );
}

export function BroadcastScore({
  score,
  size = "md"
}: {
  score: number;
  size?: "md" | "lg" | "xl";
}) {
  const sizeClass =
    size === "xl"
      ? "text-3xl sm:text-4xl"
      : size === "lg"
        ? "text-2xl sm:text-3xl"
        : "text-lg sm:text-xl";

  return (
    <span
      className={`inline-block bg-gradient-to-br from-amber-100 via-amber-50 to-sky-200 bg-clip-text font-bold tabular-nums tracking-tight text-transparent ${sizeClass}`}
    >
      {score.toLocaleString(undefined, { maximumFractionDigits: 1 })}
    </span>
  );
}

export function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300">
      {children}
    </span>
  );
}

export function StatusPill({
  tone,
  children
}: {
  tone: "success" | "warning" | "neutral" | "gold";
  children: ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
      : tone === "warning"
        ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
        : tone === "gold"
          ? "border-amber-400/35 bg-amber-500/15 text-amber-100"
          : "border-white/10 bg-white/[0.04] text-slate-300";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${toneClass}`}>
      {children}
    </span>
  );
}

export function PremiumPanel({
  children,
  className = "",
  accent = "none"
}: {
  children: ReactNode;
  className?: string;
  accent?: "none" | "gold" | "sky" | "violet";
}) {
  const accentBar =
    accent === "gold"
      ? "before:bg-amber-400/70"
      : accent === "sky"
        ? "before:bg-sky-400/70"
        : accent === "violet"
          ? "before:bg-violet-400/70"
          : "";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_40px_rgba(0,0,0,0.35)] ${
        accent !== "none" ? `before:absolute before:inset-y-0 before:left-0 before:w-1 ${accentBar}` : ""
      } ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden />
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden />
    </div>
  );
}
