"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AppBrand } from "../../components/AppBrand";
import { MobileBottomNav } from "../../components/MobileBottomNav";
import { SiteFooter } from "../../components/SiteFooter";
import { publicApiUrl } from "../../lib/env";
import { isPathAllowedForRole, navLinksForRole } from "../../lib/rbac";

const ACCESS_TOKEN_KEY = "accessToken";
const API_ME = publicApiUrl("/auth/me");

type MeUser = { email: string; role: string };

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<"checking" | "ready" | "redirecting">("checking");
  const [user, setUser] = useState<MeUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const token =
        typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
      if (!token) {
        setPhase("redirecting");
        router.replace("/login");
        return;
      }

      try {
        const res = await fetch(API_ME, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (cancelled) return;
        if (res.status === 401) {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          setPhase("redirecting");
          router.replace("/login");
          return;
        }
        if (!res.ok) {
          setUser({ email: "—", role: "unknown" });
          setPhase("ready");
          return;
        }
        const json = (await res.json()) as { user?: { email?: string; role?: string } };
        const u = json.user;
        setUser({
          email: u?.email ?? "—",
          role: u?.role != null ? String(u.role) : "—"
        });
        setPhase("ready");
      } catch {
        if (!cancelled) {
          setUser({ email: "—", role: "offline" });
          setPhase("ready");
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  const navLinks = user ? navLinksForRole(user.role) : [];

  const forbidden =
    phase === "ready" && user != null && !isPathAllowedForRole(user.role, pathname);

  useEffect(() => {
    if (!forbidden) return;
    router.replace("/dashboard");
  }, [forbidden, router]);

  function logout() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    router.replace("/login");
  }

  if (phase === "checking" || phase === "redirecting") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-maria-ocean/25 border-t-maria-ocean"
          aria-hidden
        />
        <p className="text-sm text-maria-sand/70">
          {phase === "redirecting" ? "Redirecting to sign-in…" : "Loading your session…"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-maria-forest-dark pb-mobile-nav lg:pb-0">
      <header className="maria-glass-nav sticky top-0 z-50 supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3 lg:flex-col lg:items-stretch lg:justify-start lg:gap-2.5">
            <AppBrand href="/dashboard" />
            {user ? (
              <span className="truncate rounded-full border border-maria-ocean/25 bg-maria-forest/50 px-2.5 py-1 text-[10px] font-medium capitalize text-maria-ocean-light lg:hidden">
                {user.role}
              </span>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="min-h-11 shrink-0 rounded-lg border border-maria-pearl/15 bg-maria-pearl/5 px-3 py-2 text-sm font-medium text-maria-sand hover:bg-maria-pearl/10 lg:hidden"
            >
              Log out
            </button>
          </div>

          {user ? (
            <div className="hidden rounded-lg border border-maria-pearl/10 bg-maria-forest/40 px-3 py-2 text-xs sm:block sm:flex-row sm:items-baseline sm:gap-3 lg:flex">
              <span className="text-maria-sand/70">
                Signed in as{" "}
                <span className="font-medium text-maria-pearl">{user.email}</span>
              </span>
              <span className="text-maria-sand/50">
                Role:{" "}
                <span className="font-medium capitalize text-maria-ocean-light">{user.role}</span>
              </span>
            </div>
          ) : null}

          <nav className="hidden flex-1 flex-wrap items-center gap-x-1 gap-y-2 lg:flex lg:justify-center">
            {navLinks.map(({ href, label }) => {
              const active =
                pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`min-h-10 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-maria-ocean/15 text-maria-ocean-light ring-1 ring-maria-ocean/30"
                      : "text-maria-sand/80 hover:bg-maria-pearl/5 hover:text-maria-pearl"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden shrink-0 flex-wrap items-center justify-end gap-2 lg:flex">
            <button
              type="button"
              onClick={logout}
              className="min-h-10 rounded-lg border border-maria-pearl/15 bg-maria-pearl/5 px-3 py-2 text-sm font-medium text-maria-sand hover:bg-maria-pearl/10"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {forbidden ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-maria-ocean/25 border-t-maria-ocean"
            aria-hidden
          />
          <p className="text-sm text-maria-sand/70">Opening your dashboard…</p>
        </div>
      ) : (
        children
      )}

      <SiteFooter />

      <MobileBottomNav links={navLinks} pathname={pathname} />
    </div>
  );
}
