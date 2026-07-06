import type { ReactNode } from "react";
import Link from "next/link";

/** Primary page container — consistent horizontal rhythm and max width. */
export function PageMain({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <main
      className={`mx-auto max-w-4xl px-4 pb-mobile-nav pt-4 sm:px-6 sm:pt-10 lg:pb-20 ${className}`.trim()}
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
    <header className="flex flex-col gap-4 border-b border-white/[0.07] pb-6 sm:gap-6 sm:pb-10 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
        {kicker ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-400/90">{kicker}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">{title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-[15px] max-sm:line-clamp-2">{description}</p>
      </div>
      {aside ? (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-start sm:pt-1">
          {aside}
        </div>
      ) : null}
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

export const contentStackClass = "mt-6 flex flex-col gap-6 sm:mt-10 sm:gap-8 lg:gap-10";

export const formStackClass = "flex flex-col gap-5";

/** Full-width tap targets on phones; auto width from `sm` up. */
export const btnResponsiveClass = "w-full sm:w-auto";

/** Panel around tables or stacked list rows (nautical card shell). */
export const cardListShellClass =
  "overflow-hidden rounded-xl border border-white/[0.08] bg-slate-950/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] shadow-black/30";

/** Visual grouping for related form fields. */
export const fieldGroupClass =
  "grid gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:gap-5 sm:p-5";

/** Shared input / select styling for dark nautical UI. */
export const fieldInputClass =
  "min-h-12 w-full rounded-xl border border-white/[0.08] bg-slate-950/55 px-3.5 py-3 text-base text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none ring-1 ring-transparent transition placeholder:text-slate-600 focus:border-sky-500/40 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-11 sm:py-2.5 sm:text-sm";

export const btnGhostClass =
  "inline-flex min-h-12 items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-base font-medium text-slate-100 transition hover:border-sky-500/25 hover:bg-sky-500/10 hover:text-sky-100 active:scale-[0.98] sm:min-h-11 sm:py-2.5 sm:text-sm";

export const btnPrimaryClass =
  "inline-flex min-h-12 items-center justify-center rounded-xl bg-amber-500/90 px-4 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-amber-900/20 transition hover:bg-amber-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-11 sm:py-3 sm:text-sm";

export const btnSecondaryClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-sky-500/25 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-50";

/** Label + control wrapper for stacked mobile forms. */
export function FormField({
  label,
  hint,
  optional,
  children
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {optional ? (
          <span className="ml-1 font-normal normal-case text-slate-600">(optional)</span>
        ) : null}
      </span>
      {children}
      {hint ? <span className="text-xs leading-relaxed text-slate-500">{hint}</span> : null}
    </label>
  );
}

/** Titled block for grouped inputs (boat details, media, measurements). */
export function FieldGroup({
  title,
  description,
  children,
  className = ""
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${fieldGroupClass} ${className}`.trim()}>
      <div className="space-y-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
        {description ? <p className="text-xs leading-relaxed text-slate-500">{description}</p> : null}
      </div>
      <div className={formStackClass}>{children}</div>
    </section>
  );
}

/** Role-aware shortcut row for tournament workflows (shown on phones). */
export function MobileQuickActions({ links }: { links: { href: string; label: string }[] }) {
  if (links.length === 0) return null;

  const primaryHref = links.find((l) => l.href === "/catches/new")?.href;

  return (
    <nav
      className="-mx-1 grid grid-cols-2 gap-2 pb-1 pt-2 sm:flex sm:gap-2 sm:overflow-x-auto lg:hidden"
      aria-label="Quick actions"
    >
      {links.map(({ href, label }) => {
        const isPrimary = href === primaryHref;
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold transition active:scale-[0.98] ${
              isPrimary
                ? "col-span-2 bg-amber-500/90 text-slate-950 shadow-md shadow-amber-950/30 hover:bg-amber-400 sm:col-span-1"
                : "border border-white/[0.1] bg-white/[0.04] text-slate-100 hover:border-sky-500/25 hover:bg-sky-500/10"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Sticky primary action above the bottom tab bar on small screens. */
export function StickyFormActions({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 -mx-4 border-t border-white/[0.08] bg-slate-950/95 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none lg:bottom-auto">
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

export function InlineNotice({
  variant,
  children
}: {
  variant: "error" | "success" | "info" | "warning";
  children: ReactNode;
}) {
  const box =
    variant === "error"
      ? "border-red-500/35 bg-red-950/45 text-red-100"
      : variant === "success"
        ? "border-emerald-500/35 bg-emerald-950/40 text-emerald-100"
        : variant === "warning"
          ? "border-amber-500/35 bg-amber-950/40 text-amber-100"
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
