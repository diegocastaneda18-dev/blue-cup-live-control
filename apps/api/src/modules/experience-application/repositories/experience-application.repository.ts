import type {
  CreateExperienceApplicationPayload,
  ExperienceApplicationDocument,
  ExperienceApplicationRecord,
  ExperienceApplicationStatus,
  ExperienceDocumentStatus
} from "@bluecup/types";

export const EXPERIENCE_APPLICATION_REPOSITORY = Symbol("EXPERIENCE_APPLICATION_REPOSITORY");

export type IssueLicenseData = {
  licenseIssuedAt: string;
  licensePdfPath: string;
  licenseUrl: string;
  qrValidationUrl: string;
};

export interface ExperienceApplicationRepository {
  create(record: ExperienceApplicationRecord): Promise<ExperienceApplicationRecord>;

  findByFolio(folio: string): Promise<ExperienceApplicationRecord | null>;

  findById(id: string): Promise<ExperienceApplicationRecord | null>;

  countByYear(year: number): Promise<number>;

  list(): Promise<ExperienceApplicationRecord[]>;

  updateStatus(
    folio: string,
    status: ExperienceApplicationStatus,
    internalNote?: string | null
  ): Promise<ExperienceApplicationRecord | null>;

  addDocument(
    folio: string,
    document: ExperienceApplicationDocument
  ): Promise<ExperienceApplicationRecord | null>;

  updateDocumentStatus(
    folio: string,
    documentId: string,
    status: ExperienceDocumentStatus,
    adminNote?: string | null
  ): Promise<ExperienceApplicationDocument | null>;

  issueLicense(folio: string, data: IssueLicenseData): Promise<ExperienceApplicationRecord | null>;
}

export type { CreateExperienceApplicationPayload, ExperienceApplicationRecord };
