"use client";

import { Card } from "@bluecup/ui";
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
    <main className="mx-auto flex min-h-[calc(100vh-0px)] max-w-md flex-col justify-center p-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Sign in</h1>
        <p className="mt-2 text-sm text-slate-400">Blue Cup Live Control</p>
      </div>

      <Card title="Account">
        <form className="grid gap-4" onSubmit={onSubmit}>
          {error ? (
            <div
              className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-slate-300">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-slate-100 outline-none ring-sky-500/40 placeholder:text-slate-500 focus:ring-2"
              placeholder="you@example.com"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-slate-300">Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-slate-100 outline-none ring-sky-500/40 placeholder:text-slate-500 focus:ring-2"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="mt-1 rounded-lg bg-amber-500/90 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </Card>
    </main>
  );
}
