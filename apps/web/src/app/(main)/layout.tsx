"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CommercialFooter } from "../../components/CommercialFooter";
import { MobileBottomNav } from "../../components/MobileBottomNav";
import { PremiumAppHeader } from "../../components/PremiumAppHeader";
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
    <div className="flex min-h-screen flex-col bg-slate-950 pb-mobile-nav lg:pb-0">
      <PremiumAppHeader user={user} navLinks={navLinks} pathname={pathname} onLogout={logout} />

      <div className="flex-1">
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

      <CommercialFooter className="mt-auto" />

      <MobileBottomNav links={navLinks} pathname={pathname} />
    </div>
  );
}
