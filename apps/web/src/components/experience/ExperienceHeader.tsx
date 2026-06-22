"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExperienceBrand } from "../ExperienceBrand";

const NAV = [
  { href: "#experiencias", label: "Experiencias" },
  { href: "#comunidad", label: "Comunidad" },
  { href: "#familia", label: "Familia" },
  { href: "#reservar", label: "Reservar" }
] as const;

export function ExperienceHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)] ${
        scrolled
          ? "border-b border-maria-pearl/10 bg-maria-forest-dark/95 shadow-maria-soft backdrop-blur-md"
          : "bg-gradient-to-b from-maria-forest-dark/80 to-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <ExperienceBrand variant="header" href="/" />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {NAV.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-maria-sand/85 transition hover:bg-maria-pearl/5 hover:text-maria-pearl"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-maria-sand/70 transition hover:text-maria-pearl sm:inline-flex"
          >
            Acceso
          </Link>
          <a
            href="#reservar"
            className="hidden min-h-10 items-center rounded-full bg-maria-sunset px-5 py-2 text-sm font-semibold text-maria-pearl shadow-lg shadow-maria-sunset/20 transition hover:bg-maria-sunset-light sm:inline-flex"
          >
            Planear viaje
          </a>

          <button
            type="button"
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-maria-pearl/15 text-maria-pearl lg:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
              {menuOpen ? (
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          className="border-t border-maria-pearl/10 bg-maria-forest-dark/98 px-4 py-4 lg:hidden"
          aria-label="Móvil"
        >
          <ul className="flex flex-col gap-1">
            {NAV.map(({ href, label }) => (
              <li key={href}>
                <a
                  href={href}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-maria-sand hover:bg-maria-pearl/5 hover:text-maria-pearl"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </a>
              </li>
            ))}
            <li className="mt-2 border-t border-maria-pearl/10 pt-2">
              <Link
                href="/login"
                className="flex min-h-11 items-center rounded-lg px-3 text-sm text-maria-sand/70"
                onClick={() => setMenuOpen(false)}
              >
                Acceso privado
              </Link>
            </li>
            <li>
              <a
                href="#reservar"
                className="mt-1 flex min-h-11 items-center justify-center rounded-full bg-maria-sunset px-4 text-sm font-semibold text-maria-pearl"
                onClick={() => setMenuOpen(false)}
              >
                Planear viaje
              </a>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
