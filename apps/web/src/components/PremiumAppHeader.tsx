"use client";

import Link from "next/link";
import { BrandingImage } from "./branding/BrandingImage";

export const LMBC_LOGO_SRC = "/branding/lmbc-logo.png";

type NavLink = { href: string; label: string };

type PremiumAppHeaderProps = {
  user: { email: string; role: string } | null;
  navLinks: NavLink[];
  pathname: string;
  onLogout: () => void;
};

function TournamentLogoMark({ variant = "header" }: { variant?: "header" | "login" }) {
  const isLogin = variant === "login";
  const imageClass = isLogin
    ? "h-14 max-h-14 w-auto object-contain object-left sm:h-16 sm:max-h-16 lg:h-20 lg:max-h-20"
    : "h-12 max-h-12 w-auto object-contain object-left sm:h-14 sm:max-h-14 lg:h-[72px] lg:max-h-[72px]";
  const fallbackClass = isLogin
    ? "h-14 px-4 sm:h-16 lg:h-20"
    : "h-12 px-3.5 sm:h-14 lg:h-[72px]";

  return (
    <BrandingImage
      src={LMBC_LOGO_SRC}
      alt="Las Marías Blue Cup"
      width={320}
      height={84}
      priority
      className={imageClass}
      fallback={
        <div
          className={`flex shrink-0 items-center justify-center rounded-lg border border-amber-400/25 bg-gradient-to-br from-amber-500/15 to-sky-500/10 ${fallbackClass}`}
        >
          <span className="text-xs font-bold tracking-[0.18em] text-amber-100 sm:text-sm">LMBC</span>
        </div>
      }
    />
  );
}

function UserAccountStrip({
  user,
  onLogout,
  compact = false
}: {
  user: { email: string; role: string };
  onLogout: () => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex shrink-0 items-center ${compact ? "gap-2" : "gap-2.5 sm:gap-3"}`}>
      {!compact ? (
        <div className="hidden min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5 lg:flex xl:px-3 xl:py-2">
          <span
            className="max-w-[7.5rem] truncate text-xs font-medium text-slate-100 xl:max-w-[10rem]"
            title={user.email}
          >
            {user.email}
          </span>
          <span className="h-3 w-px shrink-0 bg-white/10" aria-hidden />
          <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold capitalize tracking-wide text-amber-100/90">
            {user.role.replace(/_/g, " ")}
          </span>
        </div>
      ) : null}

      {compact ? (
        <span className="max-w-[5.5rem] truncate rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold capitalize tracking-wide text-amber-100/90">
          {user.role.replace(/_/g, " ")}
        </span>
      ) : (
        <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold capitalize tracking-wide text-amber-100/90 lg:hidden">
          {user.role.replace(/_/g, " ")}
        </span>
      )}

      <button
        type="button"
        onClick={onLogout}
        className="shrink-0 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10 lg:min-h-9 lg:px-3 lg:py-1.5 lg:text-[13px]"
      >
        Log out
      </button>
    </div>
  );
}

function DesktopNav({
  navLinks,
  pathname
}: {
  navLinks: NavLink[];
  pathname: string;
}) {
  return (
    <nav
      className="hidden min-w-0 lg:flex lg:flex-wrap lg:items-center lg:justify-center lg:gap-1 lg:px-2 lg:py-2.5"
      aria-label="Primary navigation"
    >
      {navLinks.map(({ href, label }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors xl:px-3 xl:py-2 xl:text-sm ${
              active
                ? "bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/25"
                : "text-slate-300 hover:bg-white/5 hover:text-slate-50"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function PremiumAppHeader({ user, navLinks, pathname, onLogout }: PremiumAppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#060d18]/95 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Mobile + tablet: compact single row */}
        <div className="flex items-center justify-between gap-3 py-3.5 lg:hidden">
          <Link
            href="/dashboard"
            className="group flex min-w-0 items-center gap-2.5 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-amber-400/40"
          >
            <TournamentLogoMark />
            <span className="truncate text-sm font-semibold tracking-tight text-slate-100">Blue Cup</span>
          </Link>
          {user ? <UserAccountStrip user={user} onLogout={onLogout} compact /> : null}
        </div>

        {/* Desktop: brand row + dedicated nav row — prevents overlap */}
        <div className="hidden lg:block">
          <div className="flex items-center justify-between gap-6 py-3.5 xl:py-4">
            <Link
              href="/dashboard"
              className="group flex min-w-0 max-w-[min(100%,22rem)] shrink-0 items-center gap-3.5 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-amber-400/40 xl:gap-4"
            >
              <TournamentLogoMark />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight text-slate-50 group-hover:text-white xl:text-[15px]">
                  Las Marías Blue Cup
                </p>
                <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-sky-400/80">
                  Live Control
                </p>
              </div>
            </Link>

            {user ? <UserAccountStrip user={user} onLogout={onLogout} /> : null}
          </div>

          <div className="border-t border-white/[0.06]">
            <DesktopNav navLinks={navLinks} pathname={pathname} />
          </div>
        </div>
      </div>
    </header>
  );
}

export function LoginBrandHeader() {
  return (
    <div className="mx-auto mb-8 flex w-fit flex-col items-center gap-5">
      <TournamentLogoMark variant="login" />
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-400/90">
          Las Marías Blue Cup
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-50">Sign in</h1>
      </div>
    </div>
  );
}
