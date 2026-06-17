import type { ReactNode } from "react";
import Link from "next/link";

/** Primary page container — consistent horizontal rhythm and max width. */
export function PageMain({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <main
      className={`mx-auto max-w-4xl px-4 pb-mobile-nav pt-5 sm:px-6 sm:pt-10 lg:pb-20 ${className}`.trim()}
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
    <header className="flex flex-col gap-4 border-b border-maria-pearl/10 pb-6 sm:gap-6 sm:pb-10 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
        {kicker ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-maria-ocean-light/90">
            {kicker}
          </p>
        ) : null}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-maria-pearl sm:text-3xl">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-maria-sand/75 sm:text-[15px]">{description}</p>
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
      className={`text-[11px] font-semibold uppercase tracking-[0.16em] text-maria-sand/55 ${className}`.trim()}
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
  "overflow-hidden rounded-xl border border-maria-pearl/10 bg-maria-forest/35 shadow-maria-soft shadow-black/20";

export const fieldGroupClass =
  "grid gap-4 rounded-xl border border-maria-pearl/8 bg-maria-pearl/[0.03] p-4 sm:gap-5 sm:p-5";

export const fieldInputClass =
  "min-h-11 w-full rounded-xl border border-maria-forest/15 bg-maria-pearl/95 px-3.5 py-2.5 text-base text-maria-forest-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] outline-none ring-1 ring-transparent transition placeholder:text-maria-forest/35 focus:border-maria-ocean/50 focus:ring-maria-ocean/25 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";

export const btnGhostClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-maria-pearl/15 bg-maria-pearl/5 px-4 py-2.5 text-sm font-medium text-maria-pearl transition hover:border-maria-ocean/30 hover:bg-maria-ocean/10 hover:text-maria-ocean-light";

export const btnPrimaryClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-maria-sunset px-4 py-3 text-sm font-semibold text-maria-pearl shadow-lg shadow-maria-sunset/25 transition hover:bg-maria-sunset-light disabled:cursor-not-allowed disabled:opacity-50";

export const btnSecondaryClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-maria-ocean/30 bg-maria-ocean/10 px-4 py-3 text-sm font-semibold text-maria-ocean-light transition hover:border-maria-ocean/45 hover:bg-maria-ocean/20 disabled:cursor-not-allowed disabled:opacity-50";

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
      <span className="text-[11px] font-semibold uppercase tracking-wide text-maria-sand/55">
        {label}
        {optional ? (
          <span className="ml-1 font-normal normal-case text-maria-sand/40">(optional)</span>
        ) : null}
      </span>
      {children}
      {hint ? <span className="text-xs leading-relaxed text-maria-sand/50">{hint}</span> : null}
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
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-maria-sand/55">{title}</h3>
        {description ? <p className="text-xs leading-relaxed text-maria-sand/50">{description}</p> : null}
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
      className="-mx-1 flex gap-2 overflow-x-auto pb-1 pt-1 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
      aria-label="Quick actions"
    >
      {links.map(({ href, label }) => {
        const isPrimary = href === primaryHref;
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${
              isPrimary
                ? "bg-maria-sunset text-maria-pearl shadow-md shadow-maria-sunset/25 hover:bg-maria-sunset-light"
                : "border border-maria-pearl/12 bg-maria-pearl/5 text-maria-pearl hover:border-maria-ocean/30 hover:bg-maria-ocean/10"
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
    <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 -mx-4 border-t border-maria-pearl/10 bg-maria-forest-dark/95 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none lg:bottom-auto">
      {children}
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
          ? "border-maria-sunset/35 bg-maria-sunset/10 text-maria-sunset-light"
          : "border-maria-ocean/30 bg-maria-ocean/10 text-maria-ocean-light";
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
        className="h-10 w-10 animate-spin rounded-full border-2 border-maria-ocean/20 border-t-maria-ocean"
        aria-hidden
      />
      <p className="text-sm text-maria-sand/70">{label}</p>
    </div>
  );
}
