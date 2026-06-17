"use client";

import type { ExperienceApplicationDocument, ExperienceDocumentStatus } from "@bluecup/types";
import { useState } from "react";
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_STYLES,
  downloadExperienceDocument,
  formatDateTime,
  updateExperienceDocumentStatus
} from "../../lib/experience-application-admin";
import { formatFileSize } from "../../lib/wizard-documents";

type DocumentReviewCardProps = {
  folio: string;
  document: ExperienceApplicationDocument;
  adminNote: string;
  onAdminNoteChange: (value: string) => void;
  onUpdated: () => Promise<void>;
};

const STATUS_ACTIONS: Array<{ status: ExperienceDocumentStatus; label: string; className: string }> = [
  { status: "aprobado", label: "Aprobar", className: "border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-500" },
  { status: "rechazado", label: "Rechazar", className: "border-rose-300 bg-rose-600 text-white hover:bg-rose-500" },
  { status: "incompleto", label: "Marcar incompleto", className: "border-amber-300 bg-amber-500 text-white hover:bg-amber-400" },
  { status: "pendiente", label: "Marcar pendiente", className: "border-sky-300 bg-sky-600 text-white hover:bg-sky-500" }
];

export function DocumentReviewCard({
  folio,
  document,
  adminNote,
  onAdminNoteChange,
  onUpdated
}: DocumentReviewCardProps) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function onChangeStatus(nextStatus: ExperienceDocumentStatus) {
    setSaving(true);
    setMessage(null);
    try {
      await updateExperienceDocumentStatus(folio, document.id, {
        status: nextStatus,
        adminNote: adminNote.trim() || null
      });
      setMessage(`Estatus actualizado a ${DOCUMENT_STATUS_LABELS[nextStatus]}.`);
      await onUpdated();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar el documento.");
    } finally {
      setSaving(false);
    }
  }

  async function onDownload() {
    setDownloading(true);
    setMessage(null);
    try {
      await downloadExperienceDocument(folio, document);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo abrir el documento.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <li className="rounded-xl border border-maria-forest/10 bg-maria-pearl/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-maria-forest-dark">{document.label}</p>
          <p className="mt-1 text-sm text-maria-forest/70">
            {document.originalName} · {formatFileSize(document.size)} · {document.mimeType}
          </p>
          <p className="mt-1 text-xs text-maria-forest/55">
            Cargado {formatDateTime(document.uploadedAt)}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${DOCUMENT_STATUS_STYLES[document.status]}`}
        >
          {DOCUMENT_STATUS_LABELS[document.status]}
        </span>
      </div>

      {document.adminNote ? (
        <p className="mt-3 rounded-lg border border-maria-forest/10 bg-white/70 px-3 py-2 text-sm text-maria-forest/80">
          <span className="font-semibold text-maria-forest-dark">Nota guardada: </span>
          {document.adminNote}
        </p>
      ) : null}

      {document.reviewedAt ? (
        <p className="mt-2 text-xs text-maria-forest/55">
          Revisado {formatDateTime(document.reviewedAt)}
        </p>
      ) : null}

      <label className="mt-4 grid gap-2 text-sm">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-maria-forest/50">
          Nota interna del documento
        </span>
        <textarea
          rows={3}
          value={adminNote}
          onChange={(event) => onAdminNoteChange(event.target.value)}
          className="rounded-xl border border-maria-forest/15 bg-white px-3 py-2 text-sm text-maria-forest-dark outline-none focus:border-maria-ocean/40"
          placeholder="Observaciones para este documento…"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void onDownload()}
          disabled={downloading || saving}
          className="inline-flex min-h-9 items-center justify-center rounded-full border border-maria-ocean/30 bg-maria-ocean/10 px-4 text-xs font-semibold text-maria-ocean hover:bg-maria-ocean/20 disabled:opacity-50"
        >
          {downloading ? "Abriendo…" : "Ver / Descargar"}
        </button>
        {STATUS_ACTIONS.map((action) => (
          <button
            key={action.status}
            type="button"
            onClick={() => void onChangeStatus(action.status)}
            disabled={saving || downloading || document.status === action.status}
            className={`inline-flex min-h-9 items-center justify-center rounded-full border px-4 text-xs font-semibold disabled:opacity-50 ${action.className}`}
          >
            {action.label}
          </button>
        ))}
      </div>

      {message ? <p className="mt-3 text-xs text-maria-forest/70">{message}</p> : null}
    </li>
  );
}
