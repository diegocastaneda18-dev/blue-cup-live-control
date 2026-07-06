"use client";

import Link from "next/link";
import { mobileBottomNavLinks } from "./MobileAppUi";

const SHORT_LABELS: Record<string, string> = {
  Dashboard: "Home",
  Leaderboard: "Board",
  Jackpots: "Purse",
  Teams: "Teams",
  "New Catch": "New",
  "Catch History": "History",
  Committee: "Review"
};

const NAV_ICONS: Record<string, string> = {
  "/dashboard": "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z",
  "/leaderboard": "M8 21V9m4 12V3m4 18v-7m4 7V13",
  "/jackpots": "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83",
  "/teams": "M16 11a3 3 0 1 0-6 0m8 8a4 4 0 0 0-8 0m-8 0a4 4 0 0 1 8 0",
  "/catches/new": "M12 5v14m-7-7h14",
  "/catches": "M4 6h16M4 12h16M4 18h10",
  "/committee/catches": "M9 12.5 11 14.5 15 10.5M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
};

function NavIcon({ href, active }: { href: string; active: boolean }) {
  const d = NAV_ICONS[href];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`h-5 w-5 shrink-0 ${active ? "text-amber-200" : "text-slate-500"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

function NavTab({
  href,
  label,
  pathname
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  return (
    <Link
      href={href}
      className={`flex min-h-[3.5rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-center transition-colors active:scale-[0.97] ${
        active
          ? "bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/25"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
      }`}
    >
      <NavIcon href={href} active={active} />
      <span className="truncate text-[10px] font-semibold leading-none">{SHORT_LABELS[label] ?? label}</span>
    </Link>
  );
}

export function MobileBottomNav({
  links,
  pathname
}: {
  links: { href: string; label: string }[];
  pathname: string;
}) {
  if (links.length === 0) return null;

  const hasNewCatch = links.some((l) => l.href === "/catches/new");
  const barLinks = mobileBottomNavLinks(links.filter((l) => l.href !== "/catches/new"));
  const left = barLinks.slice(0, 2);
  const right = barLinks.slice(2, 4);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-slate-950/95 backdrop-blur-md lg:hidden"
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex max-w-lg items-end justify-between gap-1 px-2 pb-[env(safe-area-inset-bottom)] pt-1">
        <div className="flex min-w-0 flex-1 justify-around gap-0.5">
          {left.map((link) => (
            <NavTab key={link.href} href={link.href} label={link.label} pathname={pathname} />
          ))}
        </div>

        {hasNewCatch ? (
          <Link
            href="/catches/new"
            className={`-mt-5 mx-1 flex h-[3.75rem] w-[3.75rem] shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-950/50 ring-2 ring-slate-950 transition active:scale-[0.96] ${
              pathname === "/catches/new" ? "ring-amber-200/60" : ""
            }`}
            aria-label="New catch"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.25">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            <span className="text-[9px] font-bold leading-none">New</span>
          </Link>
        ) : (
          <div className="w-[3.75rem] shrink-0" aria-hidden />
        )}

        <div className="flex min-w-0 flex-1 justify-around gap-0.5">
          {right.map((link) => (
            <NavTab key={link.href} href={link.href} label={link.label} pathname={pathname} />
          ))}
        </div>
      </div>
    </nav>
  );
}
