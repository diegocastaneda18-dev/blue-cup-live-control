"use client";

import { useMemo, useState } from "react";
import type { CreateExperienceApplicationResponse } from "@bluecup/types";
import { brandName, experienceTypes, type ExperienceTypeId } from "../../lib/brand";
import {
  buildExperienceApplicationPayload,
  INITIAL_WIZARD_FORM,
  submitExperienceApplication,
  validateWizardStep,
  type WizardFormState
} from "../../lib/experience-application";
import { ACCEPT_DOCUMENTS, getWizardDocumentFields, uploadExperienceApplicationDocuments, type PendingDocumentUpload, type WizardDocumentField } from "../../lib/wizard-documents";

const STEPS = ["Experiencia", "Itinerario", "Transporte", "Servicios", "Contacto", "Confirmar"] as const;

const inputClass =
  "min-h-11 w-full rounded-xl border border-maria-forest/15 bg-maria-pearl px-3.5 py-2.5 text-base text-maria-forest-dark outline-none ring-1 ring-transparent transition placeholder:text-maria-forest/35 focus:border-maria-ocean/50 focus:ring-maria-ocean/25 sm:text-sm";

const labelClass = "text-[11px] font-semibold uppercase tracking-wide text-maria-forest/55";

export function InquiryWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardFormState>(INITIAL_WIZARD_FORM);
  const [result, setResult] = useState<CreateExperienceApplicationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocumentUpload[]>([]);
  const [uploadSummary, setUploadSummary] = useState<string | null>(null);

  const progress = ((step + 1) / STEPS.length) * 100;

  const selectedLabels = useMemo(
    () =>
      experienceTypes
        .filter((e) => form.experienceTypes.includes(e.id))
        .map((e) => e.label)
        .join(", "),
    [form.experienceTypes]
  );

  const documentFields = useMemo(
    () => getWizardDocumentFields(form.transportType),
    [form.transportType]
  );

  function update<K extends keyof WizardFormState>(key: K, value: WizardFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleExperience(id: ExperienceTypeId) {
    setForm((prev) => ({
      ...prev,
      experienceTypes: prev.experienceTypes.includes(id)
        ? prev.experienceTypes.filter((x) => x !== id)
        : [...prev.experienceTypes, id]
    }));
  }

  function next() {
    const err = validateWizardStep(step, form);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function onDocumentChange(field: WizardDocumentField, event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    setPendingDocuments((prev) => {
      const withoutField = prev.filter(
        (item) => !(item.documentType === field.documentType && item.label === field.label)
      );
      if (!files?.length) return withoutField;

      const additions = Array.from(files).map((file) => ({
        documentType: field.documentType,
        label: field.label,
        file
      }));
      return [...withoutField, ...additions];
    });
  }

  async function submit() {
    const err = validateWizardStep(4, form);
    if (err) {
      setError(err);
      setStep(4);
      return;
    }
    setError(null);
    setUploadSummary(null);
    setPending(true);
    try {
      console.log("Pending documents before submit", pendingDocuments);
      const payload = buildExperienceApplicationPayload(form);
      const response = await submitExperienceApplication(payload);
      console.log("Created folio", response.folio);

      if (pendingDocuments.length > 0) {
        const { uploaded, failed } = await uploadExperienceApplicationDocuments(
          response.folio,
          pendingDocuments
        );
        if (failed.length > 0) {
          setUploadSummary(
            `Solicitud creada. Se subieron ${uploaded} documento(s); no se pudieron cargar: ${failed.join(", ")}.`
          );
        } else {
          setUploadSummary(`Solicitud creada con ${uploaded} documento(s) adjunto(s).`);
        }
      }

      setResult(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar la solicitud.");
    } finally {
      setPending(false);
    }
  }

  function reset() {
    setResult(null);
    setStep(0);
    setForm(INITIAL_WIZARD_FORM);
    setError(null);
    setPendingDocuments([]);
    setUploadSummary(null);
  }

  if (result) {
    return (
      <div className="maria-sand-panel rounded-3xl p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-maria-ocean/15 text-2xl text-maria-ocean">
          ✓
        </div>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-maria-ocean">
          Solicitud registrada
        </p>
        <h3 className="mt-2 font-display text-2xl font-semibold text-maria-forest-dark">
          Tu folio es {result.folio}
        </h3>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-maria-forest/75">
          Gracias, {result.applicant.fullName.split(" ")[0]}. Hemos recibido tu solicitud con estatus{" "}
          <span className="font-semibold text-maria-forest-dark">recibida</span>. Un concierge de{" "}
          {brandName} te contactará pronto.
        </p>
        {uploadSummary ? (
          <p className="mx-auto mt-3 max-w-md text-sm text-maria-forest/70">{uploadSummary}</p>
        ) : null}
        <dl className="mx-auto mt-8 grid max-w-sm gap-3 text-left text-sm">
          <div className="rounded-xl border border-maria-forest/10 bg-maria-pearl/80 px-4 py-3">
            <dt className={labelClass}>Folio</dt>
            <dd className="mt-1 font-mono text-base font-semibold text-maria-forest-dark">{result.folio}</dd>
          </div>
          <div className="rounded-xl border border-maria-forest/10 bg-maria-pearl/80 px-4 py-3">
            <dt className={labelClass}>Ingreso</dt>
            <dd className="mt-1 text-maria-forest-dark">{result.itinerary.arrivalDate}</dd>
          </div>
        </dl>
        <button
          type="button"
          className="mt-8 text-sm font-semibold text-maria-ocean transition hover:text-maria-ocean-dark"
          onClick={reset}
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <div className="maria-sand-panel overflow-hidden rounded-3xl">
      <div className="border-b border-maria-sand-dark/20 px-6 py-5 sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-maria-ocean">
          Paso {step + 1} de {STEPS.length}
        </p>
        <h3 className="mt-1 font-display text-xl font-semibold text-maria-forest-dark sm:text-2xl">
          {STEPS[step]}
        </h3>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-maria-sand-dark/25">
          <div
            className="h-full rounded-full bg-maria-ocean transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="px-6 py-8 sm:px-8">
        {error ? (
          <p className="mb-6 rounded-xl border border-maria-sunset/30 bg-maria-sunset/10 px-4 py-3 text-sm text-maria-sunset-dark">
            {error}
          </p>
        ) : null}

        {step === 0 ? (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {experienceTypes.map(({ id, label, icon }) => {
                const active = form.experienceTypes.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleExperience(id)}
                    className={`flex min-h-[4.5rem] items-start gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                      active
                        ? "border-maria-ocean bg-maria-ocean/10 ring-1 ring-maria-ocean/30"
                        : "border-maria-forest/10 bg-maria-pearl hover:border-maria-ocean/30"
                    }`}
                  >
                    <span className="text-xl" aria-hidden>
                      {icon}
                    </span>
                    <span className="text-sm font-semibold text-maria-forest-dark">{label}</span>
                  </button>
                );
              })}
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <label className="grid gap-2 text-sm sm:col-span-3">
                <span className={labelClass}>Lugar principal de actividad</span>
                <input
                  value={form.activityPlace}
                  onChange={(e) => update("activityPlace", e.target.value)}
                  className={inputClass}
                  placeholder="Ej. Bahía Las Marías"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className={labelClass}>Latitud</span>
                <input
                  value={form.activityLat}
                  onChange={(e) => update("activityLat", e.target.value)}
                  className={inputClass}
                  placeholder="9.1234"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className={labelClass}>Longitud</span>
                <input
                  value={form.activityLng}
                  onChange={(e) => update("activityLng", e.target.value)}
                  className={inputClass}
                  placeholder="-84.5678"
                />
              </label>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className={labelClass}>Fecha de ingreso</span>
              <input
                type="date"
                value={form.arrivalDate}
                onChange={(e) => update("arrivalDate", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className={labelClass}>Fecha de salida</span>
              <input
                type="date"
                value={form.departureDate}
                onChange={(e) => update("departureDate", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className={labelClass}>Puerto / punto de ingreso</span>
              <input
                value={form.entryPort}
                onChange={(e) => update("entryPort", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className={labelClass}>Puerto / punto de salida</span>
              <input
                value={form.exitPort}
                onChange={(e) => update("exitPort", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm sm:col-span-2">
              <span className={labelClass}>Resumen del itinerario</span>
              <textarea
                rows={3}
                value={form.itinerarySummary}
                onChange={(e) => update("itinerarySummary", e.target.value)}
                className={`${inputClass} resize-y`}
              />
            </label>
            <label className="grid gap-2 text-sm sm:col-span-2">
              <span className={labelClass}>Ruta solicitada — nombre</span>
              <input
                value={form.routeName}
                onChange={(e) => update("routeName", e.target.value)}
                className={inputClass}
                placeholder="Ej. Circuito islas · amanecer"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className={labelClass}>Desde</span>
              <input value={form.routeFrom} onChange={(e) => update("routeFrom", e.target.value)} className={inputClass} />
            </label>
            <label className="grid gap-2 text-sm">
              <span className={labelClass}>Hasta</span>
              <input value={form.routeTo} onChange={(e) => update("routeTo", e.target.value)} className={inputClass} />
            </label>
            <label className="grid gap-2 text-sm sm:col-span-2">
              <span className={labelClass}>Notas de ruta</span>
              <textarea
                rows={2}
                value={form.routeNotes}
                onChange={(e) => update("routeNotes", e.target.value)}
                className={`${inputClass} resize-y`}
              />
            </label>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm sm:col-span-2">
              <span className={labelClass}>Tipo de transporte</span>
              <select
                value={form.transportType}
                onChange={(e) =>
                  update("transportType", e.target.value as WizardFormState["transportType"])
                }
                className={inputClass}
              >
                <option value="none">Sin embarcación / aeronave propia</option>
                <option value="vessel">Embarcación</option>
                <option value="aircraft">Aeronave</option>
                <option value="both">Embarcación y aeronave</option>
              </select>
            </label>
            {(form.transportType === "vessel" || form.transportType === "both") && (
              <>
                <label className="grid gap-2 text-sm">
                  <span className={labelClass}>Nombre embarcación</span>
                  <input value={form.vesselName} onChange={(e) => update("vesselName", e.target.value)} className={inputClass} />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className={labelClass}>Matrícula</span>
                  <input
                    value={form.vesselRegistration}
                    onChange={(e) => update("vesselRegistration", e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className={labelClass}>Eslora (m)</span>
                  <input
                    value={form.vesselLengthM}
                    onChange={(e) => update("vesselLengthM", e.target.value)}
                    className={inputClass}
                  />
                </label>
              </>
            )}
            {(form.transportType === "aircraft" || form.transportType === "both") && (
              <>
                <label className="grid gap-2 text-sm">
                  <span className={labelClass}>Tipo aeronave</span>
                  <input value={form.aircraftType} onChange={(e) => update("aircraftType", e.target.value)} className={inputClass} />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className={labelClass}>Matrícula aeronave</span>
                  <input
                    value={form.aircraftRegistration}
                    onChange={(e) => update("aircraftRegistration", e.target.value)}
                    className={inputClass}
                  />
                </label>
              </>
            )}
            <label className="grid gap-2 text-sm sm:col-span-2">
              <span className={labelClass}>Notas de transporte</span>
              <textarea
                rows={2}
                value={form.transportNotes}
                onChange={(e) => update("transportNotes", e.target.value)}
                className={`${inputClass} resize-y`}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className={labelClass}>Total personas a bordo</span>
              <input
                type="number"
                min={1}
                value={form.guestsTotal}
                onChange={(e) => update("guestsTotal", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className={labelClass}>Tripulación</span>
              <input
                type="number"
                min={0}
                value={form.guestsCrew}
                onChange={(e) => update("guestsCrew", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className={labelClass}>Adultos</span>
              <input
                type="number"
                min={0}
                value={form.guestsAdults}
                onChange={(e) => update("guestsAdults", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className={labelClass}>Menores</span>
              <input
                type="number"
                min={0}
                value={form.guestsChildren}
                onChange={(e) => update("guestsChildren", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm sm:col-span-2">
              <span className={labelClass}>Nombres del grupo</span>
              <textarea
                rows={2}
                value={form.guestNames}
                onChange={(e) => update("guestNames", e.target.value)}
                className={`${inputClass} resize-y`}
              />
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm sm:col-span-2">
              <span className={labelClass}>Preferencia de hospedaje</span>
              <input
                value={form.lodgingPreference}
                onChange={(e) => update("lodgingPreference", e.target.value)}
                className={inputClass}
                placeholder="Villa privada, lodge eco-lujo, yate…"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className={labelClass}>Noches</span>
              <input
                type="number"
                min={0}
                value={form.lodgingNights}
                onChange={(e) => update("lodgingNights", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className={labelClass}>Habitaciones</span>
              <input
                type="number"
                min={0}
                value={form.lodgingRooms}
                onChange={(e) => update("lodgingRooms", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm sm:col-span-2">
              <span className={labelClass}>Notas de hospedaje</span>
              <textarea
                rows={2}
                value={form.lodgingNotes}
                onChange={(e) => update("lodgingNotes", e.target.value)}
                className={`${inputClass} resize-y`}
              />
            </label>
            <label className="grid gap-2 text-sm sm:col-span-2">
              <span className={labelClass}>Restricciones alimentarias</span>
              <input
                value={form.dietaryRestrictions}
                onChange={(e) => update("dietaryRestrictions", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className={labelClass}>Preferencias gastronómicas</span>
              <input
                value={form.foodPreferences}
                onChange={(e) => update("foodPreferences", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className={labelClass}>Presupuesto estimado</span>
              <select
                value={form.budgetRange}
                onChange={(e) => update("budgetRange", e.target.value)}
                className={inputClass}
              >
                <option value="">Prefiero discutirlo</option>
                <option value="5k-15k">USD 5,000 – 15,000</option>
                <option value="15k-50k">USD 15,000 – 50,000</option>
                <option value="50k+">USD 50,000+</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm sm:col-span-2">
              <span className={labelClass}>Observaciones generales</span>
              <textarea
                rows={4}
                value={form.observations}
                onChange={(e) => update("observations", e.target.value)}
                className={`${inputClass} resize-y`}
              />
            </label>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm sm:col-span-2">
              <span className={labelClass}>Nombre completo</span>
              <input
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                className={inputClass}
                autoComplete="name"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className={labelClass}>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={inputClass}
                autoComplete="email"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className={labelClass}>Teléfono / WhatsApp</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={inputClass}
                autoComplete="tel"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className={labelClass}>Agencia / empresa</span>
              <input value={form.company} onChange={(e) => update("company", e.target.value)} className={inputClass} />
            </label>
            <label className="grid gap-2 text-sm">
              <span className={labelClass}>Nacionalidad</span>
              <input
                value={form.nationality}
                onChange={(e) => update("nationality", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm sm:col-span-2">
              <span className={labelClass}>Firma — nombre del responsable</span>
              <input
                value={form.responsibleSignature}
                onChange={(e) => update("responsibleSignature", e.target.value)}
                className={inputClass}
                placeholder="Nombre completo como firma"
              />
            </label>
            <label className="flex items-start gap-3 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(e) => update("termsAccepted", e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-maria-forest/30"
              />
              <span className="text-maria-forest/75">
                Acepto los términos y condiciones de {brandName} y autorizo el uso de mis datos para
                coordinar esta solicitud de experiencia privada.
              </span>
            </label>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-6">
            <dl className="grid gap-4 text-sm">
              <div className="rounded-xl border border-maria-forest/10 bg-maria-pearl/70 p-4">
                <dt className={labelClass}>Experiencias</dt>
                <dd className="mt-1 font-medium text-maria-forest-dark">{selectedLabels || "—"}</dd>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-maria-forest/10 bg-maria-pearl/70 p-4">
                  <dt className={labelClass}>Ingreso</dt>
                  <dd className="mt-1 text-maria-forest-dark">
                    {form.arrivalDate}
                    {form.departureDate ? ` → ${form.departureDate}` : ""}
                  </dd>
                </div>
                <div className="rounded-xl border border-maria-forest/10 bg-maria-pearl/70 p-4">
                  <dt className={labelClass}>Personas a bordo</dt>
                  <dd className="mt-1 text-maria-forest-dark">{form.guestsTotal}</dd>
                </div>
              </div>
              <div className="rounded-xl border border-maria-forest/10 bg-maria-pearl/70 p-4">
                <dt className={labelClass}>Responsable</dt>
                <dd className="mt-1 text-maria-forest-dark">
                  {form.fullName} · {form.email}
                </dd>
              </div>
            </dl>

            <section className="rounded-3xl border border-amber-200/70 bg-white/90 p-6 shadow-sm">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700">
                  Expediente digital
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">Documentos requeridos</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Adjunta los documentos disponibles para agilizar la revisión de tu solicitud. Podrás
                  complementar documentos faltantes posteriormente.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {documentFields.map((field) => (
                  <label
                    key={`${field.documentType}-${field.label}`}
                    className="block rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <span className="block text-sm font-semibold text-slate-800">{field.label}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      PDF, JPG, PNG o WEBP · Máx. 10 MB
                    </span>
                    <input
                      type="file"
                      accept={ACCEPT_DOCUMENTS}
                      multiple={field.allowMultiple}
                      onChange={(event) => onDocumentChange(field, event)}
                      className="mt-3 block w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-800"
                    />
                  </label>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-maria-sand-dark/20 px-6 py-5 sm:flex-row sm:justify-between sm:px-8">
        <button
          type="button"
          onClick={back}
          disabled={step === 0 || pending}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-maria-forest/15 px-6 text-sm font-semibold text-maria-forest-dark transition hover:bg-maria-forest/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Atrás
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={next}
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-maria-sunset px-8 text-sm font-semibold text-maria-pearl shadow-lg shadow-maria-sunset/20 transition hover:bg-maria-sunset-light disabled:opacity-50"
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void submit()}
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-maria-ocean px-8 text-sm font-semibold text-maria-pearl shadow-lg shadow-maria-ocean/20 transition hover:bg-maria-ocean-light disabled:opacity-50"
          >
            {pending ? "Enviando…" : "Enviar solicitud"}
          </button>
        )}
      </div>
    </div>
  );
}
