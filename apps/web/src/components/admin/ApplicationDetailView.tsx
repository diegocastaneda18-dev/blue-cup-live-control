"use client";

import type { ExperienceApplicationRecord, ExperienceApplicationStatus } from "@bluecup/types";
import { useEffect, useState } from "react";
import {
  APPROVAL_BLOCKED_MESSAGE,
  EXPERIENCE_APPLICATION_STATUSES,
  STATUS_LABELS,
  TRANSPORT_TYPE_LABELS,
  fetchExperienceApplicationByFolio,
  formatDate,
  formatDateTime,
  formatEntryType,
  formatExperienceTypes,
  hasBlockingDocuments,
  generateExperienceApplicationLicense,
  LICENSE_BLOCKED_MESSAGE,
  openExperienceApplicationLicense,
  openLicenseValidationPage,
  updateExperienceApplicationStatus
} from "../../lib/experience-application-admin";
import { AdminShell } from "./AdminShell";
import { DocumentReviewCard } from "./DocumentReviewCard";
import { StatusBadge } from "./StatusBadge";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="maria-sand-panel rounded-2xl p-5 sm:p-6">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-maria-ocean">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-maria-forest/50">{label}</dt>
      <dd className="mt-1 text-sm text-maria-forest-dark">{value || "—"}</dd>
    </div>
  );
}

export function ApplicationDetailView({ folio }: { folio: string }) {
  const [record, setRecord] = useState<ExperienceApplicationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ExperienceApplicationStatus>("recibida");
  const [internalNote, setInternalNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [adminOverride, setAdminOverride] = useState(false);
  const [documentNotes, setDocumentNotes] = useState<Record<string, string>>({});
  const [isGeneratingLicense, setIsGeneratingLicense] = useState(false);
  const [licenseError, setLicenseError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [folio]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExperienceApplicationByFolio(folio);
      const documents = data.documents ?? [];
      console.log("Application documents", documents);
      setRecord(data);
      setStatus(data.status);
      setInternalNote(data.internalNote ?? "");
      setDocumentNotes(
        Object.fromEntries(documents.map((doc) => [doc.id, doc.adminNote ?? ""]))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el expediente.");
    } finally {
      setLoading(false);
    }
  }

  async function onSaveStatus(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);

    const requiresApprovalValidation = status === "aprobada" || status === "licencia_emitida";
    const blockingDocuments = hasBlockingDocuments(record?.documents);

    if (requiresApprovalValidation && blockingDocuments && !adminOverride) {
      setSaveMessage(APPROVAL_BLOCKED_MESSAGE);
      setSaving(false);
      return;
    }

    if (requiresApprovalValidation && adminOverride && !internalNote.trim()) {
      setSaveMessage("Agrega una nota interna obligatoria para la aprobación administrativa.");
      setSaving(false);
      return;
    }

    try {
      const result = await updateExperienceApplicationStatus(folio, {
        status,
        internalNote,
        adminOverride: adminOverride || undefined
      });
      setSaveMessage(`Estatus actualizado · ${result.updatedAt}`);
      setAdminOverride(false);
      await load();
    } catch (e) {
      setSaveMessage(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  const blockingDocuments = hasBlockingDocuments(record?.documents);
  const requiresApprovalValidation = status === "aprobada" || status === "licencia_emitida";
  const canGenerateLicense =
    record?.status === "aprobada" && !hasBlockingDocuments(record?.documents);

  async function handleGenerateLicense() {
    if (!record?.folio) return;

    setIsGeneratingLicense(true);
    setLicenseError(null);

    try {
      await generateExperienceApplicationLicense(record.folio);
      await load();
    } catch (error) {
      setLicenseError(
        error instanceof Error ? error.message : "No se pudo generar la licencia PDF."
      );
    } finally {
      setIsGeneratingLicense(false);
    }
  }

  async function handleDownloadLicense() {
    if (!record?.folio) return;
    setLicenseError(null);
    try {
      await openExperienceApplicationLicense(record.folio);
    } catch (error) {
      setLicenseError(
        error instanceof Error ? error.message : "No se pudo descargar la licencia PDF."
      );
    }
  }

  if (loading) {
    return (
      <AdminShell title="Expediente" backHref="/admin/experience-applications">
        <p className="text-maria-sand/70">Cargando expediente…</p>
      </AdminShell>
    );
  }

  if (error || !record) {
    return (
      <AdminShell title="Expediente" backHref="/admin/experience-applications">
        <p className="rounded-xl border border-maria-sunset/30 bg-maria-sunset/10 px-4 py-3 text-sm text-maria-sunset-light">
          {error ?? "Expediente no encontrado."}
        </p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title={record.folio}
      subtitle={`${record.applicant.fullName} · creada ${formatDateTime(record.createdAt)}`}
      backHref="/admin/experience-applications"
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge status={record.status} />
        <span className="text-sm text-maria-sand/60">Actualizada {formatDateTime(record.updatedAt)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Solicitante">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" value={record.applicant.fullName} />
              <Field label="Correo" value={record.applicant.email} />
              <Field label="Teléfono / WhatsApp" value={record.applicant.phone} />
              <Field label="Empresa" value={record.applicant.company} />
              <Field label="Nacionalidad" value={record.applicant.nationality} />
            </dl>
          </Section>

          <Section title="Embarcación o aeronave">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo" value={TRANSPORT_TYPE_LABELS[record.transport.type]} />
              <Field label="Embarcación" value={record.transport.vesselName} />
              <Field label="Matrícula embarcación" value={record.transport.vesselRegistration} />
              <Field label="Eslora (m)" value={record.transport.vesselLengthM} />
              <Field label="Aeronave" value={record.transport.aircraftType} />
              <Field label="Matrícula aeronave" value={record.transport.aircraftRegistration} />
              <Field label="Notas" value={record.transport.notes} />
            </dl>
          </Section>

          <Section title="Itinerario">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Ingreso" value={formatDate(record.itinerary.arrivalDate)} />
              <Field label="Retorno" value={formatDate(record.itinerary.departureDate)} />
              <Field label="Puerto ingreso" value={record.itinerary.entryPort} />
              <Field label="Puerto salida" value={record.itinerary.exitPort} />
              <Field label="Resumen" value={record.itinerary.summary} />
              <Field label="Tipo de ingreso" value={formatEntryType(record)} />
            </dl>
          </Section>

          <Section title="Personas a bordo">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Total" value={record.peopleOnBoard.total} />
              <Field label="Adultos" value={record.peopleOnBoard.adults} />
              <Field label="Menores" value={record.peopleOnBoard.children} />
              <Field label="Tripulación" value={record.peopleOnBoard.crew} />
              <Field label="Nombres" value={record.peopleOnBoard.guestNames} />
            </dl>
          </Section>

          <Section title="Actividades, lugares y coordenadas">
            <p className="mb-4 text-sm text-maria-forest-dark">
              {formatExperienceTypes(record.activities.experienceTypes)}
            </p>
            <div className="space-y-3">
              {record.activities.items.map((item, i) => (
                <div
                  key={`${item.name}-${i}`}
                  className="rounded-xl border border-maria-forest/10 bg-maria-pearl/70 p-4 text-sm"
                >
                  <p className="font-semibold text-maria-forest-dark">{item.name}</p>
                  <p className="mt-1 text-maria-forest/70">{item.place || "—"}</p>
                  <p className="mt-1 text-xs text-maria-forest/55">
                    {item.latitude != null && item.longitude != null
                      ? `${item.latitude}, ${item.longitude}`
                      : "Sin coordenadas"}
                    {item.scheduledDate ? ` · ${formatDate(item.scheduledDate)}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Hospedaje">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Preferencia" value={record.lodging.preference} />
              <Field label="Noches" value={record.lodging.nights} />
              <Field label="Habitaciones" value={record.lodging.rooms} />
              <Field label="Notas" value={record.lodging.notes} />
            </dl>
          </Section>

          <Section title="Alimentos">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Restricciones" value={record.food.dietaryRestrictions} />
              <Field label="Preferencias" value={record.food.preferences} />
              <Field label="Solicitudes especiales" value={record.food.specialRequests} />
            </dl>
          </Section>

          <Section title="Rutas solicitadas">
            {record.requestedRoutes.length === 0 ? (
              <p className="text-sm text-maria-forest/70">—</p>
            ) : (
              <div className="space-y-3">
                {record.requestedRoutes.map((route, i) => (
                  <div
                    key={`${route.name}-${i}`}
                    className="rounded-xl border border-maria-forest/10 bg-maria-pearl/70 p-4 text-sm"
                  >
                    <p className="font-semibold text-maria-forest-dark">{route.name}</p>
                    <p className="mt-1 text-maria-forest/70">
                      {route.from || "—"} → {route.to || "—"}
                    </p>
                    {route.notes ? <p className="mt-1 text-maria-forest/55">{route.notes}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Observaciones y legal">
            <dl className="grid gap-4">
              <Field label="Observaciones" value={record.observations} />
              <Field
                label="Términos aceptados"
                value={record.termsAccepted ? "Sí" : "No"}
              />
              <Field label="Firma responsable" value={record.responsibleSignature} />
              <Field label="Presupuesto" value={record.budgetRange} />
            </dl>
          </Section>

          <Section title="Documentos del expediente">
            {!record.documents?.length ? (
              <p className="text-sm text-maria-forest/70">No hay documentos subidos.</p>
            ) : (
              <ul className="space-y-4 text-sm text-maria-forest-dark">
                {record.documents.map((doc) => (
                  <DocumentReviewCard
                    key={doc.id}
                    folio={folio}
                    document={doc}
                    adminNote={documentNotes[doc.id] ?? doc.adminNote ?? ""}
                    onAdminNoteChange={(value) =>
                      setDocumentNotes((prev) => ({ ...prev, [doc.id]: value }))
                    }
                    onUpdated={load}
                  />
                ))}
              </ul>
            )}
          </Section>

          <section className="rounded-3xl bg-maria-cream p-8 shadow-sm ring-1 ring-maria-gold/20">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-maria-ocean">
              Licencia operativa
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-maria-forest">Licencia PDF</h3>

            {record.status === "licencia_emitida" ? (
              <div className="mt-6 rounded-2xl bg-white/80 p-5 ring-1 ring-maria-forest/10">
                <p className="text-sm font-semibold text-maria-forest">Estatus: Licencia emitida</p>
                <p className="mt-2 text-sm text-maria-forest/80">
                  Fecha de emisión: {formatDateTime(record.licenseIssuedAt)}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleDownloadLicense()}
                    className="rounded-full bg-maria-ocean px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-maria-ocean/90"
                  >
                    Descargar licencia PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => openLicenseValidationPage(record.folio)}
                    className="rounded-full border border-maria-forest/20 bg-white px-6 py-3 text-sm font-semibold text-maria-forest transition hover:bg-maria-sand-light"
                  >
                    Ver validación QR
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl bg-white/80 p-5 ring-1 ring-maria-forest/10">
                {record.status !== "aprobada" ? (
                  <p className="text-sm text-maria-forest/80">
                    Para emitir la licencia, primero aprueba la solicitud.
                  </p>
                ) : blockingDocuments ? (
                  <p className="text-sm text-maria-forest/80">{LICENSE_BLOCKED_MESSAGE}</p>
                ) : (
                  <p className="text-sm text-maria-forest/80">
                    La solicitud está aprobada. Puedes generar la licencia de coordinación operativa.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void handleGenerateLicense()}
                  disabled={isGeneratingLicense || !canGenerateLicense}
                  className="mt-4 rounded-full bg-maria-sunset px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-maria-sunset/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGeneratingLicense ? "Generando licencia..." : "Generar licencia PDF"}
                </button>
              </div>
            )}

            {licenseError ? (
              <p className="mt-3 text-sm text-rose-700">{licenseError}</p>
            ) : null}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-maria-gold/25 bg-maria-forest/50 p-5 shadow-maria-soft">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-maria-gold">
              Gestión de estatus
            </h2>
            <form onSubmit={(e) => void onSaveStatus(e)} className="mt-4 space-y-4">
              <label className="grid gap-2 text-sm">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-maria-sand/55">
                  Estatus
                </span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ExperienceApplicationStatus)}
                  className="min-h-10 rounded-xl border border-maria-pearl/12 bg-maria-forest/35 px-3 text-sm text-maria-pearl"
                >
                  {EXPERIENCE_APPLICATION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-maria-sand/55">
                  Notas internas
                </span>
                <textarea
                  rows={6}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  className="rounded-xl border border-maria-pearl/12 bg-maria-forest/35 px-3 py-2 text-sm text-maria-pearl outline-none focus:border-maria-ocean/40"
                  placeholder="Ej. Falta seguro de embarcación…"
                />
              </label>
              {requiresApprovalValidation && blockingDocuments ? (
                <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-3 text-xs text-amber-100">
                  <p>{APPROVAL_BLOCKED_MESSAGE}</p>
                  <label className="mt-3 flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={adminOverride}
                      onChange={(event) => setAdminOverride(event.target.checked)}
                      className="mt-0.5"
                    />
                    <span>Aprobar bajo criterio administrativo (requiere nota interna)</span>
                  </label>
                </div>
              ) : null}
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-maria-gold px-4 text-sm font-semibold text-maria-forest-dark hover:bg-maria-gold-light disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
              {saveMessage ? (
                <p className="text-xs text-maria-sand/70">{saveMessage}</p>
              ) : null}
            </form>
          </section>
        </aside>
      </div>
    </AdminShell>
  );
}
