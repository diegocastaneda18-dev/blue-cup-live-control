"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { clearAdminSession, isAdminAuthenticated, setAdminPassword } from "../../lib/admin-auth";
import { verifyAdminAccess } from "../../lib/experience-application-admin";
import { AdminAuthProvider } from "./AdminAuthContext";

type AdminGateProps = {
  children: ReactNode;
};

/** Temporary dev access gate — replace with Supabase Auth. */
export function AdminGate({ children }: AdminGateProps) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const logout = useCallback(() => {
    clearAdminSession();
    setPassword("");
    setError(null);
    setAuthenticated(false);
  }, []);

  useEffect(() => {
    setAuthenticated(isAdminAuthenticated());
    setReady(true);
  }, []);

  async function onSubmit(e: React.FormEvent) {
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
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo verificar el acceso.");
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

  if (!authenticated) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-maria-gold">
          Acceso operativo
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-maria-pearl">
          Panel Las Marías
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-maria-sand/75">
          Acceso temporal de desarrollo. Se reemplazará por Supabase Auth.
        </p>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
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
      </div>
    );
  }

  return (
    <AdminAuthProvider logout={logout}>
      {children}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          type="button"
          onClick={logout}
          className="rounded-full border border-maria-pearl/15 bg-maria-forest-dark/95 px-4 py-2 text-xs font-medium text-maria-sand/80 shadow-maria-soft backdrop-blur hover:text-maria-pearl"
        >
          Cerrar sesión / volver a ingresar
        </button>
      </div>
    </AdminAuthProvider>
  );
}
