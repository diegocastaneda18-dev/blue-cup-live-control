"use client";

import { Card } from "@bluecup/ui";
import {
  btnPrimaryClass,
  btnResponsiveClass,
  fieldInputClass,
  formStackClass,
  InlineNotice
} from "../../components/PageChrome";
import { CommercialFooter } from "../../components/CommercialFooter";
import { LoginBrandHeader } from "../../components/PremiumAppHeader";
import { getPublicApiBaseUrl } from "../../lib/env";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API_BASE_URL = getPublicApiBaseUrl();
const API_LOGIN = `${API_BASE_URL}/auth/login`;
const ACCESS_TOKEN_KEY = "accessToken";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch(API_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = (await res.json().catch(() => null)) as
        | { accessToken?: string; message?: string | string[] }
        | null;
      if (!res.ok) {
        if (res.status === 401) {
          setError("Invalid credentials");
          return;
        }
        if (res.status === 403) {
          setError("Forbidden");
          return;
        }
        const msg = data?.message;
        const text = Array.isArray(msg) ? msg.join(" ") : msg;
        setError(text?.trim() ? String(text) : `Login failed (${res.status}).`);
        return;
      }
      if (!data?.accessToken) {
        setError("Login succeeded but no access token was returned.");
        return;
      }
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      router.replace("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-950">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-8 sm:pb-[env(safe-area-inset-bottom)]">
        <LoginBrandHeader />

        <p className="-mt-2 mb-6 text-center text-base leading-relaxed text-slate-400 sm:mb-8 sm:text-sm">
          Log catches, check standings, and stay on the water — no laptop required.
        </p>

        <Card title="Your account">
        <form className={formStackClass} onSubmit={onSubmit}>
          {error ? <InlineNotice variant="error">{error}</InlineNotice> : null}

          <label className="grid gap-2 text-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              inputMode="email"
              enterKeyHint="next"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldInputClass}
              placeholder="you@example.com"
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              enterKeyHint="go"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldInputClass}
              placeholder="••••••••"
            />
          </label>

          <div className="sticky bottom-[env(safe-area-inset-bottom)] -mx-1 border-t border-white/[0.06] bg-slate-950/95 pt-4 backdrop-blur-md sm:static sm:border-0 sm:bg-transparent sm:pt-0 sm:backdrop-blur-none">
            <button
              type="submit"
              disabled={pending}
              className={`${btnPrimaryClass} ${btnResponsiveClass}`}
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>
      </Card>
      </main>

      <CommercialFooter className="hidden sm:block" />
    </div>
  );
}
