import type { ExperienceDocumentType, ExperienceTransportType } from "@bluecup/types";

export type PendingDocumentUpload = {
  documentType: ExperienceDocumentType;
  label: string;
  file: File;
};

export type WizardDocumentField = {
  documentType: ExperienceDocumentType;
  label: string;
  allowMultiple?: boolean;
};

const VESSEL_FIELDS: WizardDocumentField[] = [
  { documentType: "vessel_registration", label: "Registro / matrícula de embarcación" },
  { documentType: "vessel_insurance", label: "Seguro vigente" },
  { documentType: "vessel_departure_authorization", label: "Despacho / autorización de salida" },
  { documentType: "owner_id", label: "Identificación del propietario o representante" },
  { documentType: "captain_id", label: "Identificación del capitán" }
];

const AIRCRAFT_FIELDS: WizardDocumentField[] = [
  { documentType: "aircraft_registration", label: "Matrícula de aeronave" },
  { documentType: "aircraft_insurance", label: "Seguro vigente" },
  { documentType: "aircraft_operational_docs", label: "Documentación operativa" },
  { documentType: "pilot_id", label: "Identificación del piloto" },
  { documentType: "flight_plan", label: "Plan de vuelo / ruta" }
];

const GENERAL_FIELDS: WizardDocumentField[] = [
  {
    documentType: "passenger_id",
    label: "Identificaciones de pasajeros / tripulación",
    allowMultiple: true
  },
  { documentType: "other", label: "Otros documentos complementarios", allowMultiple: true }
];

export function getWizardDocumentFields(transportType: ExperienceTransportType): WizardDocumentField[] {
  if (transportType === "vessel") return [...VESSEL_FIELDS, ...GENERAL_FIELDS];
  if (transportType === "aircraft") return [...AIRCRAFT_FIELDS, ...GENERAL_FIELDS];
  if (transportType === "both") return [...VESSEL_FIELDS, ...AIRCRAFT_FIELDS, ...GENERAL_FIELDS];
  return GENERAL_FIELDS;
}

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
export const ACCEPT_DOCUMENTS = ".pdf,.jpg,.jpeg,.png,.webp";

export async function uploadExperienceDocument(
  folio: string,
  pending: PendingDocumentUpload
): Promise<void> {
  const formData = new FormData();
  formData.append("documentType", pending.documentType);
  formData.append("label", pending.label);
  formData.append("file", pending.file);

  const response = await fetch(
    `/api/experience-applications/${encodeURIComponent(folio)}/documents`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || `No se pudo cargar ${pending.label}`);
  }
}

export async function uploadExperienceApplicationDocuments(
  folio: string,
  documents: PendingDocumentUpload[]
): Promise<{ uploaded: number; failed: string[] }> {
  return uploadPendingDocuments(folio, documents);
}

export async function uploadPendingDocuments(
  folio: string,
  documents: PendingDocumentUpload[]
): Promise<{ uploaded: number; failed: string[] }> {
  let uploaded = 0;
  const failed: string[] = [];

  for (const doc of documents) {
    try {
      await uploadExperienceDocument(folio, doc);
      uploaded += 1;
    } catch {
      failed.push(doc.label);
    }
  }

  return { uploaded, failed };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
