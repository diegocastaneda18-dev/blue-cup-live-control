"use client";

import type { ExperienceApplicationRecord } from "@bluecup/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  EXPERIENCE_APPLICATION_STATUSES,
  STATUS_LABELS,
  TRANSPORT_TYPE_LABELS,
  type ApplicationFilters,
  displayText,
  fetchExperienceApplications,
  filterApplications,
  formatDate,
  formatEntryType,
  isAdminUnauthorizedError,
  isAdminForbiddenError
} from "../../lib/experience-application-admin";
import { useAdminAuth } from "./AdminAuthContext";
import { AdminShell } from "./AdminShell";
import { StatusBadge } from "./StatusBadge";

export function ApplicationsDashboard() {
  const { logout } = useAdminAuth();
  const [rows, setRows] = useState<ExperienceApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ApplicationFilters>({
    query: "",
    status: "all",
    entryType: "all"
  });

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const applications = await fetchExperienceApplications();
      setRows(applications);
    } catch (e) {
      if (isAdminUnauthorizedError(e)) {
        setError(e.message);
        return;
      }
      if (isAdminForbiddenError(e)) {
        setError(e.message);
        return;
      }
      setError(e instanceof Error ? e.message : "Error al cargar solicitudes.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => filterApplications(rows, filters), [rows, filters]);

  return (
    <AdminShell
      title="Solicitudes de experiencia"
      subtitle="Gestiona expedientes, revisa información y actualiza estatus operativos."
    >
      <div className="maria-sand-panel mb-6 rounded-2xl p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-4">
          <label className="grid gap-2 text-sm lg:col-span-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-maria-forest/55">
              Buscar
            </span>
            <input
              value={filters.query}
              onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
              className="min-h-10 rounded-xl border border-maria-forest/15 bg-maria-pearl px-3 text-sm text-maria-forest-dark outline-none focus:border-maria-ocean/40"
              placeholder="Folio, nombre, correo o teléfono"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-maria-forest/55">
              Estatus
            </span>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  status: e.target.value as ApplicationFilters["status"]
                }))
              }
              className="min-h-10 rounded-xl border border-maria-forest/15 bg-maria-pearl px-3 text-sm text-maria-forest-dark"
            >
              <option value="all">Todos</option>
              {EXPERIENCE_APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-maria-forest/55">
              Tipo de ingreso
            </span>
            <select
              value={filters.entryType}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  entryType: e.target.value as ApplicationFilters["entryType"]
                }))
              }
              className="min-h-10 rounded-xl border border-maria-forest/15 bg-maria-pearl px-3 text-sm text-maria-forest-dark"
            >
              <option value="all">Todos</option>
              {Object.entries(TRANSPORT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-4 text-xs text-maria-forest/55">
          {filtered.length} solicitud{filtered.length === 1 ? "" : "es"} · ordenadas por fecha más
          reciente
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-maria-sunset/30 bg-maria-sunset/10 px-4 py-3 text-sm text-maria-sunset-light">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 inline-flex min-h-9 items-center rounded-full border border-maria-pearl/20 px-4 text-xs font-semibold text-maria-pearl hover:bg-maria-forest-dark/40"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-maria-pearl/10 bg-maria-forest/35 shadow-maria-soft">
        {loading ? (
          <p className="px-6 py-12 text-center text-sm text-maria-sand/70">Cargando solicitudes…</p>
        ) : filtered.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-maria-sand/70">
            {rows.length === 0
              ? "No hay solicitudes registradas todavía."
              : "No hay solicitudes que coincidan con los filtros."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-maria-pearl/10 bg-maria-forest/50 text-[11px] uppercase tracking-wide text-maria-sand/55">
                <tr>
                  <th className="px-4 py-3 font-semibold">Folio</th>
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Teléfono</th>
                  <th className="px-4 py-3 font-semibold">Tipo de ingreso</th>
                  <th className="px-4 py-3 font-semibold">Fecha de llegada</th>
                  <th className="px-4 py-3 font-semibold">Fecha de retorno</th>
                  <th className="px-4 py-3 font-semibold">Personas a bordo</th>
                  <th className="px-4 py-3 font-semibold">Estatus</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id ?? row.folio}
                    className="border-b border-maria-pearl/5 hover:bg-maria-pearl/[0.03]"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-maria-gold-light">
                      {displayText(row.folio)}
                    </td>
                    <td className="px-4 py-3 font-medium text-maria-pearl">
                      {displayText(row.applicant?.fullName)}
                    </td>
                    <td className="px-4 py-3 text-maria-sand/80">
                      {displayText(row.applicant?.email)}
                    </td>
                    <td className="px-4 py-3 text-maria-sand/80">
                      {displayText(row.applicant?.phone)}
                    </td>
                    <td className="px-4 py-3 text-maria-sand/80">{formatEntryType(row)}</td>
                    <td className="px-4 py-3 text-maria-sand/80">
                      {formatDate(row.itinerary?.arrivalDate)}
                    </td>
                    <td className="px-4 py-3 text-maria-sand/80">
                      {formatDate(row.itinerary?.departureDate)}
                    </td>
                    <td className="px-4 py-3 text-maria-sand/80">
                      {displayText(row.peopleOnBoard?.total)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/experience-applications/${encodeURIComponent(row.folio)}`}
                        className="inline-flex min-h-9 items-center rounded-full border border-maria-gold/35 bg-maria-gold/10 px-3 text-xs font-semibold text-maria-gold-light hover:bg-maria-gold/20"
                      >
                        Ver expediente
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
