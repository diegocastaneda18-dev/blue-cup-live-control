"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  ADMIN_SUPABASE_EMAIL_KEY,
  ADMIN_SUPABASE_TOKEN_KEY,
  clearAdminSession,
  getAdminAuthMode,
  getAdminEmail,
  hasStoredSupabaseAccessToken,
  isAdminAuthenticated,
  setAdminPassword,
  setAdminSupabaseSession
} from "../../lib/admin-auth";
import { verifyAdminAccess } from "../../lib/experience-application-admin";
import { getSupabaseClient } from "../../lib/supabase-client";
import { AdminAuthProvider } from "./AdminAuthContext";

type AdminGateProps = {
  children: ReactNode;
};

export function AdminGate({ children }: AdminGateProps) {
  const adminAuthMode = process.env.NEXT_PUBLIC_ADMIN_AUTH_MODE ?? "password";
  const useSupabaseAuth = adminAuthMode === "supabase";

  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionReady, setSessionReady] = useState(!useSupabaseAuth);
  const [adminEmail, setAdminEmailState] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const logout = useCallback(async () => {
    if (useSupabaseAuth) {
      try {
        await getSupabaseClient().auth.signOut();
      } catch {
        // ignore sign-out errors; local session is cleared below
      }
    }
    clearAdminSession();
    setPassword("");
    setEmail("");
    setAdminEmailState(null);
    setError(null);
    setAuthenticated(false);
    setSessionReady(!useSupabaseAuth);
  }, [useSupabaseAuth]);

  useEffect(() => {
    async function initSession() {
      if (useSupabaseAuth) {
        try {
          const supabase = getSupabaseClient();
          const {
            data: { session }
          } = await supabase.auth.getSession();

          if (session?.access_token) {
            sessionStorage.setItem(ADMIN_SUPABASE_TOKEN_KEY, session.access_token);
            sessionStorage.setItem(ADMIN_SUPABASE_EMAIL_KEY, session.user.email ?? "");
            setAdminSupabaseSession({
              accessToken: session.access_token,
              email: session.user.email ?? getAdminEmail()
            });
            setAdminEmailState(session.user.email ?? getAdminEmail());
            setSessionReady(true);
            setAuthenticated(true);
          } else if (hasStoredSupabaseAccessToken()) {
            setAdminEmailState(getAdminEmail());
            setSessionReady(true);
            setAuthenticated(true);
          }
        } catch {
          if (hasStoredSupabaseAccessToken()) {
            setAdminEmailState(getAdminEmail());
            setSessionReady(true);
            setAuthenticated(true);
          }
        }
      } else {
        setAuthenticated(isAdminAuthenticated());
        setSessionReady(true);
      }
      setReady(true);
    }

    void initSession();
  }, [useSupabaseAuth]);

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const ok = await verifyAdminAccess(password);
      if (!ok) {
        setError("Contraseña incorrecta.");
        return;
      }
      setAdminPassword(password);
      setSessionReady(true);
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo verificar el acceso.");
    } finally {
      setPending(false);
    }
  }

  async function onSupabaseSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (signInError || !data.session?.access_token) {
        setError(signInError?.message || "No se pudo iniciar sesión.");
        return;
      }

      sessionStorage.setItem(ADMIN_SUPABASE_TOKEN_KEY, data.session.access_token);
      sessionStorage.setItem(ADMIN_SUPABASE_EMAIL_KEY, data.user?.email ?? email.trim());
      setAdminSupabaseSession({
        accessToken: data.session.access_token,
        email: data.user?.email ?? email.trim()
      });

      if (!hasStoredSupabaseAccessToken()) {
        setError("No se pudo guardar la sesión de administrador.");
        return;
      }

      setAdminEmailState(data.user?.email ?? email.trim());
      setSessionReady(true);
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setPending(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-maria-sand/70">
        Cargando acceso…
      </div>
    );
  }

  if (!authenticated || (useSupabaseAuth && !sessionReady)) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-maria-gold">
          Acceso operativo
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-maria-pearl">
          Panel Las Marías
        </h1>
        {useSupabaseAuth ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-maria-sand/75">
              Inicia sesión con tu cuenta autorizada de Supabase.
            </p>
            <form onSubmit={(e) => void onSupabaseSubmit(e)} className="mt-8 space-y-4">
              {error ? (
                <p className="rounded-xl border border-maria-sunset/30 bg-maria-sunset/10 px-4 py-3 text-sm text-maria-sunset-light">
                  {error}
                </p>
              ) : null}
              <label className="grid gap-2 text-sm">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-maria-sand/55">
                  Correo
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-h-11 rounded-xl border border-maria-pearl/15 bg-maria-forest/40 px-3.5 text-maria-pearl outline-none ring-maria-ocean/30 focus:ring-2"
                  autoComplete="email"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-maria-sand/55">
                  Contraseña
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-h-11 rounded-xl border border-maria-pearl/15 bg-maria-forest/40 px-3.5 text-maria-pearl outline-none ring-maria-ocean/30 focus:ring-2"
                  autoComplete="current-password"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-maria-gold px-6 text-sm font-semibold text-maria-forest-dark hover:bg-maria-gold-light disabled:opacity-50"
              >
                {pending ? "Iniciando sesión…" : "Iniciar sesión"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-maria-sand/75">
              Acceso temporal de desarrollo. Se reemplazará por Supabase Auth.
            </p>
            <form onSubmit={(e) => void onPasswordSubmit(e)} className="mt-8 space-y-4">
              {error ? (
                <p className="rounded-xl border border-maria-sunset/30 bg-maria-sunset/10 px-4 py-3 text-sm text-maria-sunset-light">
                  {error}
                </p>
              ) : null}
              <label className="grid gap-2 text-sm">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-maria-sand/55">
                  Contraseña
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-h-11 rounded-xl border border-maria-pearl/15 bg-maria-forest/40 px-3.5 text-maria-pearl outline-none ring-maria-ocean/30 focus:ring-2"
                  autoComplete="current-password"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-maria-gold px-6 text-sm font-semibold text-maria-forest-dark hover:bg-maria-gold-light disabled:opacity-50"
              >
                {pending ? "Verificando…" : "Entrar al panel"}
              </button>
            </form>
          </>
        )}
      </div>
    );
  }

  return (
    <AdminAuthProvider logout={() => void logout()} adminEmail={adminEmail} authMode={getAdminAuthMode()}>
      {children}
    </AdminAuthProvider>
  );
}
