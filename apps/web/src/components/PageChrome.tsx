import type { ReactNode } from "react";

/** Primary page container — consistent horizontal rhythm and max width. */
export function PageMain({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <main
      className={`mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10 ${className}`.trim()}
    >
      {children}
    </main>
  );
}

/** Page title block with optional kicker (nautical / ops tone) and right rail. */
export function PageHeader({
  kicker,
  title,
  description,
  aside
}: {
  kicker?: string;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-6 border-b border-white/[0.07] pb-8 sm:flex-row sm:items-start sm:justify-between sm:pb-10">
      <div className="min-w-0 flex-1 space-y-2">
        {kicker ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-400/90">{kicker}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">{title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-[15px]">{description}</p>
      </div>
      {aside ? <div className="flex shrink-0 flex-wrap items-start gap-2 sm:pt-1">{aside}</div> : null}
    </header>
  );
}

/** Section heading above cards or lists. */
export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={`text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 ${className}`.trim()}
    >
      {children}
    </h2>
  );
}

export const contentStackClass = "mt-10 flex flex-col gap-8 sm:gap-10";

/** Panel around tables or stacked list rows (nautical card shell). */
export const cardListShellClass =
  "overflow-hidden rounded-xl border border-white/[0.08] bg-slate-950/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] shadow-black/30";

/** Shared input / select styling for dark nautical UI. */
export const fieldInputClass =
  "w-full rounded-xl border border-white/[0.08] bg-slate-950/55 px-3.5 py-2.5 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none ring-1 ring-transparent transition placeholder:text-slate-600 focus:border-sky-500/40 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50";

export const btnGhostClass =
  "inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:border-sky-500/25 hover:bg-sky-500/10 hover:text-sky-100";

export function InlineNotice({
  variant,
  children
}: {
  variant: "error" | "success" | "info";
  children: ReactNode;
}) {
  const box =
    variant === "error"
      ? "border-red-500/35 bg-red-950/45 text-red-100"
      : variant === "success"
        ? "border-emerald-500/35 bg-emerald-950/40 text-emerald-100"
        : "border-sky-500/30 bg-sky-950/35 text-sky-100";
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${box}`}
    >
      {children}
    </div>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-14" role="status" aria-live="polite">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-sky-400/20 border-t-sky-400"
        aria-hidden
      />
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}
