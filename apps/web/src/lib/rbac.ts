/** Full app navigation (admin sees all). Order matches sponsor-facing priority. */
const NAV_ALL: { href: string; label: string }[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/teams", label: "Teams" },
  { href: "/catches/new", label: "New Catch" },
  { href: "/catches", label: "Catch History" },
  { href: "/committee/catches", label: "Committee" }
];

export function normalizeRole(role: string): string {
  return role.trim().toLowerCase().replace(/\s+/g, "_");
}

/**
 * Navigation links for the authenticated user.
 * Role comes from `GET /auth/me` → `user.role` (see `(main)/layout.tsx`).
 */
export function navLinksForRole(role: string): { href: string; label: string }[] {
  const r = normalizeRole(role);
  if (r === "admin") return [...NAV_ALL];
  if (r === "committee") {
    return [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/catches", label: "Catch History" },
      { href: "/committee/catches", label: "Committee" }
    ];
  }
  if (r === "captain" || r === "team_member") {
    return [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/teams", label: "Teams" },
      { href: "/catches/new", label: "New Catch" },
      { href: "/catches", label: "Catch History" },
      { href: "/leaderboard", label: "Leaderboard" }
    ];
  }
  return [{ href: "/dashboard", label: "Dashboard" }];
}

function isDashboardPath(p: string): boolean {
  return p === "/dashboard" || p.startsWith("/dashboard/");
}

/**
 * Whether `pathname` may be shown for this role. If false, `(main)/layout` redirects to `/dashboard`.
 */
export function isPathAllowedForRole(role: string, pathname: string): boolean {
  const r = normalizeRole(role);
  const p = pathname.split("?")[0] ?? pathname;

  if (r === "admin") return true;

  if (r === "unknown" || r === "offline" || r === "—" || r === "" || r === "public_view") {
    return isDashboardPath(p);
  }

  if (r === "committee") {
    if (p.startsWith("/teams")) return false;
    if (p.startsWith("/catches/new")) return false;
    if (p.startsWith("/committee")) return true;
    if (isDashboardPath(p)) return true;
    if (p === "/leaderboard" || p.startsWith("/leaderboard/")) return true;
    if (p === "/catches" || p.startsWith("/catches/")) return true;
    return false;
  }

  if (r === "captain" || r === "team_member") {
    if (p.startsWith("/committee")) return false;
    if (isDashboardPath(p)) return true;
    if (p === "/leaderboard" || p.startsWith("/leaderboard/")) return true;
    if (p.startsWith("/teams")) return true;
    if (p === "/catches" || p.startsWith("/catches/")) return true;
    return false;
  }

  return isDashboardPath(p);
}
