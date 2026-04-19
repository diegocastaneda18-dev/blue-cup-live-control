"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
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
          className="h-9 w-9 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400"
          aria-hidden
        />
        <p className="text-sm text-slate-400">
          {phase === "redirecting" ? "Redirecting to sign-in…" : "Loading your session…"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-slate-950/95 shadow-[0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Blue Cup
            </span>
            {user ? (
              <div className="flex flex-col rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs sm:flex-row sm:items-baseline sm:gap-3">
                <span className="text-slate-400">
                  Signed in as{" "}
                  <span className="font-medium text-slate-100">{user.email}</span>
                </span>
                <span className="text-slate-500">
                  Role:{" "}
                  <span className="font-medium capitalize text-amber-100/90">{user.role}</span>
                </span>
              </div>
            ) : null}
          </div>

          <nav className="flex flex-1 flex-wrap items-center gap-x-1 gap-y-2 lg:justify-center">
            {navLinks.map(({ href, label }) => {
              const active =
                pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
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

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-white/10"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {forbidden ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400"
            aria-hidden
          />
          <p className="text-sm text-slate-400">Opening your dashboard…</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
