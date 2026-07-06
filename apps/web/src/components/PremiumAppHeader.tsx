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
          className={`flex items-center justify-center rounded-lg border border-amber-400/25 bg-gradient-to-br from-amber-500/15 to-sky-500/10 ${fallbackClass}`}
        >
          <span className="text-xs font-bold tracking-[0.18em] text-amber-100 sm:text-sm">LMBC</span>
        </div>
      }
    />
  );
}

export function PremiumAppHeader({ user, navLinks, pathname, onLogout }: PremiumAppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#060d18]/95 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-6xl px-4 py-3.5 sm:px-6 sm:py-4 lg:py-4">
        <div className="flex items-center gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-8">
          <Link
            href="/dashboard"
            className="group flex min-w-0 items-center gap-3.5 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-amber-400/40 sm:gap-4 lg:justify-self-start"
          >
            <TournamentLogoMark />
            <div className="min-w-0 hidden sm:block">
              <p className="truncate text-sm font-semibold tracking-tight text-slate-50 group-hover:text-white">
                Las Marías Blue Cup
              </p>
              <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-sky-400/80">
                Live Control
              </p>
            </div>
            <span className="truncate text-sm font-semibold tracking-tight text-slate-100 sm:hidden">
              Blue Cup
            </span>
          </Link>

          <nav
            className="hidden lg:flex lg:justify-self-center lg:items-center lg:gap-0.5"
            aria-label="Primary navigation"
          >
            {navLinks.map(({ href, label }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`min-h-10 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:justify-self-end lg:ml-0">
            {user ? (
              <>
                <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs md:flex">
                  <span className="max-w-[11rem] truncate text-slate-400">
                    <span className="font-medium text-slate-100">{user.email}</span>
                  </span>
                  <span className="h-3 w-px bg-white/10" aria-hidden />
                  <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 font-medium capitalize text-amber-100/90">
                    {user.role}
                  </span>
                </div>
                <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium capitalize text-amber-100/90 md:hidden">
                  {user.role}
                </span>
              </>
            ) : null}
            <button
              type="button"
              onClick={onLogout}
              className="min-h-10 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10"
            >
              Log out
            </button>
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
