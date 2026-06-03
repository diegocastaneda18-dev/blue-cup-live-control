"use client";

import Link from "next/link";

const SHORT_LABELS: Record<string, string> = {
  Dashboard: "Home",
  Leaderboard: "Board",
  Teams: "Teams",
  "New Catch": "New",
  "Catch History": "History",
  Committee: "Review"
};

const NAV_ICONS: Record<string, string> = {
  "/dashboard": "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z",
  "/leaderboard":
    "M8 21V9m4 12V3m4 18v-7m4 7V13",
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

export function MobileBottomNav({
  links,
  pathname
}: {
  links: { href: string; label: string }[];
  pathname: string;
}) {
  if (links.length === 0) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-slate-950/95 backdrop-blur-md lg:hidden"
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex max-w-6xl items-stretch justify-around gap-0.5 px-1 pb-[env(safe-area-inset-bottom)] pt-1.5">
        {links.map(({ href, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
          const isPrimary = href === "/catches/new";
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[3.75rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-center transition-colors active:scale-[0.98] ${
                active
                  ? "bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/25"
                  : isPrimary
                    ? "text-amber-200/90 hover:bg-amber-500/10"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              }`}
            >
              <NavIcon href={href} active={active} />
              <span className="truncate text-[10px] font-semibold leading-none">
                {SHORT_LABELS[label] ?? label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
