"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ExperienceBrand } from "../ExperienceBrand";
import { useAdminAuth } from "./AdminAuthContext";

export function AdminShell({
  title,
  subtitle,
  backHref,
  children
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  children: ReactNode;
}) {
  const { logout, adminEmail } = useAdminAuth();

  return (
    <div className="min-h-screen bg-maria-forest-dark">
      <header className="border-b border-maria-pearl/10 bg-maria-forest-dark/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <ExperienceBrand variant="header" href="/" />
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
            {adminEmail ? (
              <p className="text-xs text-maria-sand/70">{adminEmail}</p>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-maria-pearl/15 px-4 py-2 text-xs font-medium text-maria-sand/80 hover:text-maria-pearl"
            >
              Cerrar sesión
            </button>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-maria-gold">
                Operaciones
              </p>
              <p className="text-sm text-maria-sand/70">Las Marías Experience</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {backHref ? (
              <Link
                href={backHref}
                className="mb-3 inline-flex text-sm font-medium text-maria-ocean-light hover:text-maria-ocean"
              >
                ← Volver al listado
              </Link>
            ) : null}
            <h1 className="font-display text-3xl font-semibold tracking-tight text-maria-pearl sm:text-4xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-maria-sand/75">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
