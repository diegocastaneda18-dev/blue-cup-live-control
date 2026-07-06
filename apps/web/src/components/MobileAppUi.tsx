"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CatchStatusBadge } from "./CatchStatusBadge";
import { BroadcastScore } from "./tournament/PremiumBoardUi";

/** Bottom bar: prioritize captain ops — jackpots reachable from dashboard / team profile. */
export function mobileBottomNavLinks(links: { href: string; label: string }[]) {
  const has = (href: string) => links.some((l) => l.href === href);
  const pick = (href: string) => links.find((l) => l.href === href);

  const ordered: { href: string; label: string }[] = [];
  for (const href of ["/dashboard", "/teams", "/catches", "/leaderboard", "/jackpots"]) {
    const link = pick(href);
    if (link) ordered.push(link);
  }
  if (ordered.length === 0) return links.slice(0, 5);
  return ordered.slice(0, 5);
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel
}: {
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      className="grid gap-2 rounded-2xl border border-white/[0.08] bg-black/25 p-1.5"
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`min-h-12 rounded-xl px-4 py-3 text-left transition active:scale-[0.99] ${
              active
                ? "bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-950/40 ring-1 ring-amber-300/40"
                : "bg-transparent text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <span className="block text-sm font-bold">{opt.label}</span>
            {opt.hint ? (
              <span className={`mt-0.5 block text-xs ${active ? "text-slate-800/80" : "text-slate-500"}`}>
                {opt.hint}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function MediaCaptureField({
  kind,
  label,
  hint,
  file,
  inputKey,
  onFile
}: {
  kind: "photo" | "video";
  label: string;
  hint?: string;
  file: File | null;
  inputKey: number;
  onFile: (file: File | null) => void;
}) {
  const inputId = `media-${kind}-${inputKey}`;

  return (
    <div className="grid gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <label
        htmlFor={inputId}
        className={`flex min-h-[4.5rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 transition active:scale-[0.99] ${
          file
            ? "border-emerald-400/40 bg-emerald-500/10"
            : "border-white/[0.12] bg-white/[0.03] hover:border-amber-400/30 hover:bg-amber-500/5"
        }`}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] text-xl" aria-hidden>
          {kind === "photo" ? "📷" : "🎬"}
        </span>
        <span className="text-center text-sm font-semibold text-slate-100">
          {file ? file.name : kind === "photo" ? "Tap to take or choose photo" : "Tap to record or choose video"}
        </span>
        {hint && !file ? <span className="text-center text-xs text-slate-500">{hint}</span> : null}
        {file ? (
          <button
            type="button"
            className="mt-1 text-xs font-semibold text-red-300 underline decoration-red-400/40"
            onClick={(e) => {
              e.preventDefault();
              onFile(null);
            }}
          >
            Remove
          </button>
        ) : null}
      </label>
      <input
        id={inputId}
        key={inputKey}
        type="file"
        accept={kind === "photo" ? "image/*" : "video/*"}
        capture="environment"
        className="sr-only"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

export function CatchHistoryCard({
  status,
  type,
  categoryName,
  categoryCode,
  speciesName,
  speciesCode,
  scoreValue,
  scoreLabel,
  createdAt,
  mediaCount,
  mediaLine,
  href
}: {
  status: string;
  type: string;
  categoryName?: string | null;
  categoryCode?: string | null;
  speciesName?: string | null;
  speciesCode?: string | null;
  scoreValue: number | null;
  scoreLabel?: string | null;
  createdAt: string;
  mediaCount: number;
  mediaLine?: string | null;
  href: string;
}) {
  const speciesLine = speciesName
    ? `${speciesName}${speciesCode ? ` (${speciesCode})` : ""}`
    : categoryName
      ? `${categoryName}${categoryCode ? ` (${categoryCode})` : ""}`
      : null;

  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition active:scale-[0.99] hover:border-amber-400/20 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <CatchStatusBadge status={status} size="lg" />
        {scoreValue != null && scoreValue > 0 ? (
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Score</p>
            <BroadcastScore score={scoreValue} size="lg" />
            {scoreLabel && scoreLabel.includes("prelim") ? (
              <p className="mt-0.5 max-w-[8rem] truncate text-[10px] text-slate-500">{scoreLabel}</p>
            ) : null}
          </div>
        ) : (
          <span className="text-sm font-medium text-slate-600">No score</span>
        )}
      </div>

      <div className="mt-3 min-w-0">
        <p className="text-lg font-bold capitalize text-slate-50">{type.replace(/_/g, " ")}</p>
        {speciesLine ? <p className="mt-1 truncate text-base text-slate-300">{speciesLine}</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/[0.06] pt-3 text-xs text-slate-500">
        <span>{createdAt}</span>
        <span className="text-slate-700">·</span>
        <span>{mediaLine ?? (mediaCount > 0 ? `${mediaCount} media` : "No media")}</span>
        <span className="ml-auto font-semibold text-amber-200/80 group-hover:text-amber-100">Details →</span>
      </div>
    </Link>
  );
}

export function MobileScoreHero({
  status,
  score,
  type,
  speciesOrCategory
}: {
  status: string;
  score: string | null;
  type: string;
  speciesOrCategory: string | null;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-amber-500/10 via-transparent to-transparent p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <CatchStatusBadge status={status} size="lg" />
        <p className="font-mono text-[11px] text-slate-600">Catch record</p>
      </div>
      <p className="mt-4 text-2xl font-bold capitalize text-slate-50 sm:text-3xl">{type.replace(/_/g, " ")}</p>
      {speciesOrCategory ? <p className="mt-1 text-base text-slate-300">{speciesOrCategory}</p> : null}
      <div className="mt-5 border-t border-white/[0.06] pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Score line</p>
        {score ? (
          <p className="mt-1 text-xl font-bold text-amber-100">{score}</p>
        ) : (
          <p className="mt-1 text-lg text-slate-500">Pending scoring</p>
        )}
      </div>
    </div>
  );
}

export function CaptainQuickTile({
  href,
  label,
  sublabel,
  accent = "default"
}: {
  href: string;
  label: string;
  sublabel?: string;
  accent?: "default" | "gold" | "sky";
}) {
  const accentClass =
    accent === "gold"
      ? "border-amber-400/25 bg-amber-500/10 hover:bg-amber-500/15"
      : accent === "sky"
        ? "border-sky-400/25 bg-sky-500/10 hover:bg-sky-500/15"
        : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]";

  return (
    <Link
      href={href}
      className={`flex min-h-[4.75rem] flex-col justify-center rounded-2xl border px-4 py-3 transition active:scale-[0.98] ${accentClass}`}
    >
      <span className="text-sm font-bold text-slate-50">{label}</span>
      {sublabel ? <span className="mt-0.5 text-xs text-slate-400">{sublabel}</span> : null}
    </Link>
  );
}

export function MobilePodiumStrip({
  entries
}: {
  entries: { rank: number; teamName: string; score: number }[];
}) {
  if (entries.length === 0) return null;

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 pt-1 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
      {entries.slice(0, 3).map((e) => (
        <div
          key={e.rank}
          className={`min-w-[9.5rem] shrink-0 rounded-2xl border px-4 py-4 ${
            e.rank === 1
              ? "border-amber-400/35 bg-amber-500/12"
              : e.rank === 2
                ? "border-slate-400/25 bg-white/[0.04]"
                : "border-amber-800/30 bg-amber-950/20"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {e.rank === 1 ? "Leader" : e.rank === 2 ? "2nd" : "3rd"}
          </p>
          <p className="mt-2 truncate text-sm font-bold text-slate-50">{e.teamName}</p>
          <div className="mt-2">
            <BroadcastScore score={e.score} size="md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-2xl border border-white/[0.08] bg-black/20" open={defaultOpen}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-200 marker:content-none [&::-webkit-details-marker]:hidden">
        {title}
        <span className="text-xs text-slate-500 group-open:hidden">Show</span>
        <span className="hidden text-xs text-slate-500 group-open:inline">Hide</span>
      </summary>
      <div className="border-t border-white/[0.06] px-4 py-4">{children}</div>
    </details>
  );
}
