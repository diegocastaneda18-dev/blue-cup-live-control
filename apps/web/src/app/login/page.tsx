"use client";

import { Card } from "@bluecup/ui";
import { ExperienceBrand } from "../../components/ExperienceBrand";
import {
  btnPrimaryClass,
  btnResponsiveClass,
  fieldInputClass,
  formStackClass,
  InlineNotice
} from "../../components/PageChrome";
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
    <div className="maria-hero-gradient min-h-[100dvh]">
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4 py-8 pb-[env(safe-area-inset-bottom)] sm:px-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <ExperienceBrand variant="hero" showTagline />
          <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight text-maria-pearl">
            Acceso privado
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-maria-sand/80">
            Yates, pesca deportiva, surf, buceo y experiencias a medida — desde cualquier dispositivo.
          </p>
        </div>

        <Card title="Tu cuenta">
          <form className={formStackClass} onSubmit={onSubmit}>
            {error ? <InlineNotice variant="error">{error}</InlineNotice> : null}

            <label className="grid gap-2 text-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-maria-forest/60">
                Email
              </span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldInputClass}
                placeholder="you@example.com"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-maria-forest/60">
                Password
              </span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldInputClass}
                placeholder="••••••••"
              />
            </label>

            <button
              type="submit"
              disabled={pending}
              className={`${btnPrimaryClass} ${btnResponsiveClass}`}
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </Card>

        <footer className="mt-10 flex justify-center pb-4">
          <ExperienceBrand variant="footer" />
        </footer>
      </main>
    </div>
  );
}
